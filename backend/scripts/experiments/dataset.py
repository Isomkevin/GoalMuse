"""
Fixed dataset for Opik experiments: synthetic board + goals + tasks + journal.
Used to compare prompt versions or models on a reproducible set of inputs.
"""
# Each item: goals (list of {id, title, description}), tasks (list of {id, title, goal_id, completed_at}),
# journal_snippets (list of str), completed_count (int).
# ids can be synthetic UUIDs or short ids for readability.

FIXED_DATASET = [
    {
        "id": "item_1",
        "description": "Fitness and career goals with mixed tasks",
        "goals": [
            {"id": "g1", "title": "Run 3x per week", "description": "Build endurance and consistency"},
            {"id": "g2", "title": "Ship the Q1 feature", "description": "Backend API and frontend integration"},
        ],
        "tasks": [
            {"id": "t1", "title": "Morning run 5k", "goal_id": "g1", "completed_at": "2025-02-08T09:00:00Z"},
            {"id": "t2", "title": "Write API spec", "goal_id": "g2", "completed_at": None},
            {"id": "t3", "title": "Stretch routine", "goal_id": "g1", "completed_at": None},
        ],
        "journal_snippets": ["Felt good after the run. Need to focus on API tomorrow."],
        "completed_count": 1,
    },
    {
        "id": "item_2",
        "description": "Learning and health",
        "goals": [
            {"id": "g1", "title": "Complete ML course", "description": "Finish 6-week online course"},
            {"id": "g2", "title": "Sleep 7+ hours", "description": "Consistent sleep schedule"},
        ],
        "tasks": [
            {"id": "t1", "title": "Watch module 3", "goal_id": "g1", "completed_at": "2025-02-07T20:00:00Z"},
            {"id": "t2", "title": "Bed by 10:30", "goal_id": "g2", "completed_at": None},
        ],
        "journal_snippets": [],
        "completed_count": 1,
    },
    {
        "id": "item_3",
        "description": "Single goal, many tasks",
        "goals": [
            {"id": "g1", "title": "Prepare for interview", "description": "System design and coding practice"},
        ],
        "tasks": [
            {"id": "t1", "title": "Read design doc", "goal_id": "g1", "completed_at": "2025-02-08T14:00:00Z"},
            {"id": "t2", "title": "Practice 2 LC problems", "goal_id": "g1", "completed_at": None},
            {"id": "t3", "title": "Mock interview", "goal_id": "g1", "completed_at": None},
        ],
        "journal_snippets": ["Reviewed distributed systems. Need more practice on trees."],
        "completed_count": 1,
    },
    {
        "id": "item_4",
        "description": "Three goals with synergies",
        "goals": [
            {"id": "g1", "title": "Write blog monthly", "description": "Technical writing and SEO"},
            {"id": "g2", "title": "Grow Twitter", "description": "Share learnings and build audience"},
            {"id": "g3", "title": "Deepen React skills", "description": "Advanced patterns and performance"},
        ],
        "tasks": [
            {"id": "t1", "title": "Draft post on React Server Components", "goal_id": "g3", "completed_at": None},
            {"id": "t2", "title": "Tweet thread on RSC", "goal_id": "g2", "completed_at": None},
        ],
        "journal_snippets": ["Ideas: RSC post could feed Twitter thread and portfolio."],
        "completed_count": 0,
    },
    {
        "id": "item_5",
        "description": "No goals yet",
        "goals": [],
        "tasks": [{"id": "t1", "title": "Misc task", "goal_id": None, "completed_at": None}],
        "journal_snippets": ["Still figuring out priorities."],
        "completed_count": 0,
    },
]
