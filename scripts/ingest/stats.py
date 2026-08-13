"""
Report what the pipeline actually produced.

Run after ingestion to see coverage at a glance — and, more importantly, to see the gaps.
A number that looks thin here is a number that will look thin to a learner.
"""

from __future__ import annotations

from collections import Counter

from common import CONTENT, read_json, step


def _safe(relative: str, default):
    try:
        return read_json(relative)
    except FileNotFoundError:
        return default


def main() -> None:
    step("Content inventory")

    vocab = _safe("vocabulary/entries.json", {"items": []})
    items = vocab.get("items", [])
    if items:
        with_audio = sum(1 for i in items if i["audioPath"])
        with_vi = sum(1 for i in items if i["meaningVi"])
        with_ipa = sum(1 for i in items if i["ipaUk"] or i["ipaUs"])
        with_ex = sum(1 for i in items if i["examples"])
        levels = Counter(i["cefr"] for i in items)
        print(f"  vocabulary           {len(items):>7,} entries")
        print(f"    Vietnamese meaning {with_vi:>7,}  ({with_vi/len(items):.0%})")
        print(f"    IPA                {with_ipa:>7,}  ({with_ipa/len(items):.0%})")
        print(f"    human audio        {with_audio:>7,}  ({with_audio/len(items):.0%})")
        print(f"    example sentences  {with_ex:>7,}  ({with_ex/len(items):.0%})")
        print("    by level           " + "  ".join(f"{k}:{levels[k]}" for k in sorted(levels)))

    lists = _safe("vocabulary/lists.json", {"lists": []}).get("lists", [])
    print(f"  word lists           {len(lists):>7,}")

    grammar = _safe("grammar/topics.json", {"topics": []}).get("topics", [])
    if grammar:
        exercises = sum(len(t["exercises"]) for t in grammar)
        examples = sum(len(t["examples"]) for t in grammar)
        linked = sum(1 for t in grammar if t["voaArticleId"])
        print(f"  grammar topics       {len(grammar):>7,}")
        print(f"    attested examples  {examples:>7,}")
        print(f"    exercises          {exercises:>7,}")
        print(f"    linked VOA article {linked:>7,}")

    voa = _safe("voa/articles.json", {"articles": []}).get("articles", [])
    if voa:
        audio = sum(1 for a in voa if a["audioUrl"])
        glossary = sum(len(a["glossary"]) for a in voa)
        words = sum(a["wordCount"] for a in voa)
        series = Counter(a["series"] for a in voa)
        print(f"  VOA articles         {len(voa):>7,}")
        print(f"    with audio         {audio:>7,}")
        print(f"    glossary entries   {glossary:>7,}")
        print(f"    words of text      {words:>7,}")
        print("    series             " + ", ".join(f"{k} {v}" for k, v in series.most_common()))

    sentences = _safe("sentences/tatoeba.json", {"sentences": []}).get("sentences", [])
    print(f"  bilingual sentences  {len(sentences):>7,}")

    total = sum(p.stat().st_size for p in CONTENT.rglob("*.json"))
    print(f"\n  content/ on disk     {total / 1024 / 1024:>7.1f} MB")


if __name__ == "__main__":
    main()
