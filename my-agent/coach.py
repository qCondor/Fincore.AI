import asyncio
import json
import logging
import os
import queue
import threading
import uuid
from typing import Optional, AsyncGenerator
import boto3
from tracing import get_chat_client, get_chat_prompt

logger = logging.getLogger("fincore.coach")

# Bedrock model to use
BEDROCK_MODEL = os.getenv("BEDROCK_MODEL", "eu.anthropic.claude-sonnet-4-5-20250929-v1:0")


def _build_personality_traits(scores: dict) -> tuple[str, list]:
    """Build personality trait insights from OCEAN scores.

    Returns:
        Tuple of (traits_text, trait_labels) where traits_text is bullet points
        and trait_labels is a list of (trait_name, driver) tuples for scan context.
    """
    o = scores.get("openness", 50)
    c = scores.get("conscientiousness", 50)
    e = scores.get("extraversion", 50)
    a = scores.get("agreeableness", 50)
    n = scores.get("neuroticism", 50)

    traits = []
    trait_labels = []

    # Openness insights
    if o >= 70:
        traits.append("highly curious about new financial products — engage their interest, suggest diverse strategies")
        trait_labels.append(("high openness", "novelty and new experiences"))
    elif o >= 50:
        traits.append("moderately open to new ideas — balance novelty with practicality")
    elif o >= 30:
        traits.append("somewhat cautious about new financial products — emphasise stability")
    else:
        traits.append("prefers proven, familiar approaches — avoid trendy products, stick to established advice")
        trait_labels.append(("low openness", "reliability and the familiar"))

    # Conscientiousness insights
    if c >= 70:
        traits.append("disciplined planner who responds well to structured budgets and step-by-step breakdowns")
        trait_labels.append(("high conscientiousness", "quality and long-term value"))
    elif c >= 50:
        traits.append("reasonably organised but can improve on consistency — provide gentle structure")
    elif c >= 30:
        traits.append("tends toward spontaneity — keep advice simple and actionable")
    else:
        traits.append("struggles with consistency — recommend simple, low-friction systems and gentle accountability nudges")
        trait_labels.append(("low conscientiousness", "convenience and instant gratification"))

    # Extraversion insights
    if e >= 70:
        traits.append("socially-driven spender who may overspend in group settings — acknowledge the social dimension of money")
        trait_labels.append(("high extraversion", "social connection and how others might perceive it"))
    elif e >= 50:
        traits.append("enjoys social spending but not excessive — help balance social and solo finances")
    elif e >= 30:
        traits.append("prefers independent decisions — social pressure unlikely to affect spending")
    else:
        traits.append("independent decision-maker driven by logic and data, not social pressure")
        trait_labels.append(("low extraversion", "personal utility over social appeal"))

    # Agreeableness insights
    if a >= 70:
        traits.append("highly agreeable, may over-lend or struggle to say no — be tactful when addressing boundary-setting with money")
        trait_labels.append(("high agreeableness", "pleasing others or avoiding conflict"))
    elif a >= 50:
        traits.append("balanced between generosity and boundaries — occasionally needs help saying no")
    elif a >= 30:
        traits.append("comfortable setting financial boundaries — may benefit from occasional generosity prompts")
    else:
        traits.append("assertive with money and good at boundaries — may need encouragement around generosity")
        trait_labels.append(("low agreeableness", "personal benefit and practicality"))

    # Neuroticism insights
    if n >= 70:
        traits.append("financially anxious and prone to guilt around spending — be calm, reassuring, and concrete")
        trait_labels.append(("high neuroticism", "anxiety relief or emotional comfort"))
    elif n >= 50:
        traits.append("occasionally stressed about money — provide reassurance when needed")
    elif n >= 30:
        traits.append("generally calm about finances — straightforward advice works well")
    else:
        traits.append("relaxed about finances, may under-monitor accounts — encourage healthy check-ins without inducing worry")
        trait_labels.append(("low neuroticism", "low-stakes enjoyment without overthinking"))

    traits_text = "\n".join(f"- {t}" for t in traits)
    return traits_text, trait_labels


def _build_scan_context(scan_data: dict, trait_labels: list) -> str:
    """Build scan context block for the prompt."""
    product_name = scan_data.get("product_name", "an item")
    estimated_price = scan_data.get("estimated_price")
    psychology_cost = scan_data.get("psychology_cost", "")
    category = scan_data.get("category", "")

    price_str = f"£{estimated_price:.2f}" if estimated_price else "unknown price"

    trait_hint = ""
    if trait_labels:
        trait_name, trait_driver = trait_labels[0]
        trait_hint = f"Given their {trait_name}, they may have been drawn to this because of {trait_driver}."

    return f"""IMPORTANT — SCAN CONTEXT:
The user just scanned a product: "{product_name}" ({price_str}).
{f'Category: {category}' if category else ''}
{f'Psychology insight: {psychology_cost}' if psychology_cost else ''}
{trait_hint}

You MUST acknowledge this specific item in your opening. Start by referencing what they scanned.
Example opener: "I noticed you were looking at that {price_str} {product_name}..."
Then explore the psychological drivers behind the purchase urge, connecting it to their personality profile."""


def build_system_prompt(profile: dict, scan_data: Optional[dict] = None, personalized: bool = True) -> str:
    """Build the system prompt for Faith.

    Fetches the prompt template from Langfuse (faith-chat, production label) and
    populates it with user-specific variables. Falls back to hardcoded prompt if
    Langfuse is unavailable.

    Args:
        profile: User profile dict with big_five scores
        scan_data: Optional scan context
        personalized: If False, don't use personality-specific insights
    """
    # Check if user has disabled personalized insights
    security_prefs = profile.get("security_prefs", {})
    if security_prefs.get("personalizedInsights") is False:
        personalized = False

    scores = profile.get("big_five", {})
    o = scores.get("openness", 50)
    c = scores.get("conscientiousness", 50)
    e = scores.get("extraversion", 50)
    a = scores.get("agreeableness", 50)
    n = scores.get("neuroticism", 50)

    name = profile.get("name", "the user")
    traits_text, trait_labels = _build_personality_traits(scores)

    # Build scan context
    scan_context = ""
    if scan_data and personalized:
        scan_context = _build_scan_context(scan_data, trait_labels)
    elif scan_data and not personalized:
        product_name = scan_data.get("product_name", "an item")
        estimated_price = scan_data.get("estimated_price")
        price_str = f"£{estimated_price:.2f}" if estimated_price else "unknown price"
        scan_context = f"""SCAN CONTEXT:
The user just scanned a product: "{product_name}" ({price_str}).
Acknowledge this item and provide helpful financial guidance about the purchase."""

    # Return generic prompt if personalized insights are disabled
    if not personalized:
        return f"""You are Faith, a friendly financial coach. You help users make better financial decisions with practical, actionable advice.

Your style:
- Warm and helpful
- Focus on practical financial guidance
- Provide clear, actionable suggestions
- Use British English (pounds, not dollars)

You are speaking with {name}.
{scan_context}
Guidelines:
- Give helpful, practical financial advice
- Keep responses concise (3-5 sentences unless more detail is needed)
- Never give regulated financial advice — frame everything as guidance and suggest a professional for major decisions

IMPORTANT: At the very end of EVERY response, include exactly 3 suggested follow-up questions or actions:
[SUGGESTIONS]
- First suggestion (short, 2-6 words)
- Second suggestion (short, 2-6 words)
- Third suggestion (short, 2-6 words)
[/SUGGESTIONS]"""

    # Try to fetch prompt from Langfuse
    langfuse_template, _ = get_chat_prompt("faith-chat", label="production")

    if langfuse_template:
        # Populate the Langfuse template with variables
        try:
            prompt = langfuse_template.replace("{{user_name}}", name)
            prompt = prompt.replace("{{openness}}", str(o))
            prompt = prompt.replace("{{conscientiousness}}", str(c))
            prompt = prompt.replace("{{extraversion}}", str(e))
            prompt = prompt.replace("{{agreeableness}}", str(a))
            prompt = prompt.replace("{{neuroticism}}", str(n))
            prompt = prompt.replace("{{personality_traits}}", traits_text)
            prompt = prompt.replace("{{scan_context}}", scan_context)
            logger.info("Using Langfuse prompt template for faith-chat")
            return prompt
        except Exception as ex:
            logger.warning(f"Failed to populate Langfuse template: {ex}, falling back to hardcoded")

    # Fallback to hardcoded prompt
    logger.info("Using hardcoded prompt template for faith-chat")

    scores_summary = f"""OCEAN Scores (0-100 scale):
- Openness: {o}
- Conscientiousness: {c}
- Extraversion: {e}
- Agreeableness: {a}
- Neuroticism: {n}"""

    return f"""You are Faith, a Financial Psychologist and personal money coach. You combine warmth with gentle challenge — you genuinely care about your clients, but you're not afraid to ask the difficult questions that help them grow.

Your style:
- Warm and curious, never judgmental
- Ask probing questions that encourage self-reflection
- Connect spending impulses to deeper psychological patterns
- Celebrate wins, but gently challenge rationalisations
- Use "I wonder..." and "What do you think..." to invite reflection

You are speaking with {name}. Based on their Big Five personality assessment (OCEAN model), here is their financial personality profile:

{scores_summary}

Personality insights:
{traits_text}
{scan_context}
Guidelines:
- Always tailor responses to this specific personality — never give generic advice
- Be conversational and insightful, like a therapist who specialises in money
- Keep responses concise but thought-provoking (3-5 sentences unless more detail is needed)
- Use British English (pounds, not dollars)
- Never give regulated financial advice — frame everything as guidance and suggest a professional for major decisions
- When discussing purchases, explore the "why" behind the want — what need is this purchase trying to meet?

IMPORTANT: At the very end of EVERY response, you MUST include exactly 3 suggested follow-up questions or actions for the user, formatted as:
[SUGGESTIONS]
- First suggestion (short, 2-6 words)
- Second suggestion (short, 2-6 words)
- Third suggestion (short, 2-6 words)
[/SUGGESTIONS]

These should be contextual to your response - things the user might naturally want to ask or do next. Examples: "Tell me more", "How do I start?", "What about weekends?", "Set a budget for this", "Show my spending trends"."""


def _s3():
    return boto3.client("s3")


def _bedrock_runtime():
    return boto3.client("bedrock-runtime", region_name="eu-west-2")


def get_profile(user_id: str, bucket: str) -> dict:
    try:
        obj = _s3().get_object(Bucket=bucket, Key=f"users/{user_id}/profile.json")
        return json.loads(obj["Body"].read())
    except Exception:
        return {}


def save_profile(user_id: str, profile: dict, bucket: str):
    _s3().put_object(
        Bucket=bucket,
        Key=f"users/{user_id}/profile.json",
        Body=json.dumps(profile),
        ContentType="application/json",
    )


async def stream_coach_response(
    user_id: str,
    message: str,
    bucket: str,
    conversation_history: Optional[list] = None,
    scan_id: Optional[str] = None,
    scan_data: Optional[dict] = None,
    session_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """Stream AI coach response with true token-by-token streaming.

    Args:
        user_id: The user's unique identifier
        message: The user's chat message
        bucket: S3 bucket for user profiles
        conversation_history: Optional list of previous messages for context
        scan_id: Optional ID of a recent product scan
        scan_data: Optional dict containing scan details
        session_id: Optional session ID for tracing continuity
    """
    # Run the blocking boto3 S3 call in a thread
    profile = await asyncio.to_thread(get_profile, user_id, bucket)
    system_prompt = build_system_prompt(profile, scan_data=scan_data)

    # Extract user_name for tracing
    user_name = profile.get("name") if profile else None

    # Build messages array for Bedrock (converse API format - no "type" key)
    messages = []

    # Add conversation history
    if conversation_history:
        for msg in conversation_history:
            messages.append({
                "role": msg.get("role", "user"),
                "content": [{"text": msg.get("content", "")}]
            })

    # Add current message
    messages.append({
        "role": "user",
        "content": [{"text": message}]
    })

    # Initialize Langfuse trace
    langfuse = get_chat_client()
    trace = None
    generation = None

    if langfuse:
        try:
            trace = langfuse.trace(
                name="faith-chat",
                user_id=user_id,
                session_id=session_id or str(uuid.uuid4()),
                metadata={
                    "user_name": user_name or user_id,
                    "has_profile": bool(profile),
                    "has_scan_context": bool(scan_data),
                    "scan_id": scan_id,
                    "conversation_length": len(conversation_history) if conversation_history else 0,
                },
                tags=["chat", "faith-coach"],
            )
            generation = trace.generation(
                name="claude-bedrock-chat",
                model=BEDROCK_MODEL,
                input={"system_prompt": system_prompt[:500] + "...", "user_message": message},
                metadata={
                    "scan_product": scan_data.get("product_name") if scan_data else None,
                },
            )
            logger.info(f"Langfuse trace created: {trace.id} for user {user_name or user_id}")
        except Exception as e:
            logger.warning(f"Failed to create Langfuse trace: {e}")

    full_response = []

    try:
        # Use Bedrock's converse_stream for true streaming
        bedrock = _bedrock_runtime()

        # Start the streaming call in a thread (just the initial call)
        response = await asyncio.to_thread(
            bedrock.converse_stream,
            modelId=BEDROCK_MODEL,
            messages=messages,
            system=[{"text": system_prompt}],
            inferenceConfig={
                "maxTokens": 1024,
                "temperature": 0.7,
            }
        )

        # Process the stream - iterate in thread chunks to not block
        stream = response.get("stream")
        if stream:
            # Create a queue to pass chunks between threads
            chunk_queue: queue.Queue = queue.Queue()
            done_sentinel = object()

            def read_stream():
                try:
                    for event in stream:
                        if "contentBlockDelta" in event:
                            delta = event["contentBlockDelta"].get("delta", {})
                            if "text" in delta:
                                chunk_queue.put(delta["text"])
                finally:
                    chunk_queue.put(done_sentinel)

            # Start reading in background thread
            reader_thread = threading.Thread(target=read_stream, daemon=True)
            reader_thread.start()

            # Yield chunks as they arrive
            while True:
                try:
                    # Use short timeout to stay responsive
                    chunk = await asyncio.to_thread(chunk_queue.get, True, 0.05)
                    if chunk is done_sentinel:
                        break
                    full_response.append(chunk)
                    yield chunk
                except:
                    # Queue.get timeout - check if reader is still alive
                    if not reader_thread.is_alive():
                        break
                    await asyncio.sleep(0.01)

    except Exception as e:
        logger.error(f"Bedrock streaming error: {e}")
        error_msg = "I'm having trouble connecting right now. Please try again in a moment."
        full_response.append(error_msg)
        yield error_msg

    finally:
        # Complete the Langfuse generation
        if generation:
            try:
                output_text = "".join(full_response)
                generation.end(
                    output=output_text[:1000] + "..." if len(output_text) > 1000 else output_text,
                    usage={
                        "input": len(message.split()),
                        "output": len(output_text.split()),
                    },
                )
                logger.info(f"Langfuse generation completed for trace {trace.id}")
            except Exception as e:
                logger.warning(f"Failed to end Langfuse generation: {e}")
