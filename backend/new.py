import os
from typing import List
from newsapi import NewsApiClient

def get_news_lines(query: str, max_items: int = 6) -> List[str]:
    """Return concise news lines for a query using NewsAPI.

    Each line is formatted like: "Title - Source | Description"
    """
    api_key = os.getenv('NEWS_API_KEY') or '0c17b412e22846c6b1ce4cd63d5d9fb4'
    try:
        client = NewsApiClient(api_key=api_key)
        q = (query or 'crypto OR bitcoin OR ethereum').strip()
        res = client.get_everything(
            q=q,
            language='en',
            sort_by='publishedAt',
            page_size=max_items,
        )
        articles = (res or {}).get('articles', [])
        lines: List[str] = []
        for a in articles[:max_items]:
            title = a.get('title') or ''
            src = (a.get('source') or {}).get('name') or ''
            desc = a.get('description') or ''
            parts = [p for p in [f"{title} - {src}".strip(' -'), desc] if p]
            lines.append(" | ".join(parts)[:300])
        return lines
    except Exception as e:
        print(f"NewsAPI error: {e}")
        return []

if __name__ == '__main__':
    # Simple manual test runner that prints JSON only
    import json as _json
    q = os.getenv('NEWS_TEST_QUERY', 'bitcoin')
    lines = get_news_lines(q, max_items=5)
    print(_json.dumps({
        'query': q,
        'count': len(lines),
        'lines': lines,
    }, ensure_ascii=False))
