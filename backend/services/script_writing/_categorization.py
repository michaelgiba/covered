from pydantic import BaseModel, Field
from typing import Literal, Union, Optional
from services.llm import LLMService


class ExternalArticle(BaseModel):
    category_type: Literal["EXTERNAL_ARTICLE_WORTH_READING"] = (
        "EXTERNAL_ARTICLE_WORTH_READING"
    )
    why_is_it_worth_reading: str
    link: str


class TopicResearch(BaseModel):
    category_type: Literal["TOPIC_WORTH_RESEARCHING"] = "TOPIC_WORTH_RESEARCHING"
    why_is_it_worth_researching: str
    topic: str


class QuestionAnswer(BaseModel):
    category_type: Literal["QUESTION_ANSWER"] = "QUESTION_ANSWER"


class UnknownInput(BaseModel):
    category_type: Literal["UNKNOWN_INPUT"] = "UNKNOWN_INPUT"


# Union type for the response
Category = Union[ExternalArticle, TopicResearch, QuestionAnswer, UnknownInput]


# Wrapper to help the LLM understand it needs to pick one
class CategorizationResponse(BaseModel):
    selection: Category


def categorize_email(email_content: str) -> Category:
    llm_service = LLMService()

    prompt = f"""
    You are an expert email categorizer for a radio show host.
    Analyze the following email and categorize it into one of the following 4 categories:
    
    1. EXTERNAL_ARTICLE_WORTH_READING: The user sent a link to an article that sounds interesting.
    2. TOPIC_WORTH_RESEARCHING: The user suggested a topic to talk about (without a specific link, or in addition to it).
    3. QUESTION_ANSWER: The user asked a direct question to the host.
    4. UNKNOWN_INPUT: The input is gibberish, spam, or doesn't fit the above.

    Email Content:
    {email_content}
    """

    # We use a wrapper because sometimes top-level Unions can be tricky for some JSON schema generators
    # But let's try passing the wrapper model.
    # We use a wrapper because sometimes top-level Unions can be tricky for some JSON schema generators
    # But let's try passing the wrapper model.
    result = llm_service.prompt_without_search(prompt, CategorizationResponse)
    if result:
        return result.selection

    # Fallback
    return UnknownInput()
