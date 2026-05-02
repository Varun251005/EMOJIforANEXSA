# Emoji Explanation Challenge Platform

Full-stack React + Firebase app for the Emoji Explanation challenge.

## Firestore data model

### questions (collection)
Documents should be ordered by the numeric `order` field.

Example document:

```
{
	"text": "API rate limiting",
	"order": 1
}
```

### responses (collection)
Each response is stored as its own document with the participant USN.

Example document:

```
{
	"usn": "1AB23CS456",
	"questionId": "<question_doc_id>",
	"questionText": "API rate limiting",
	"order": 1,
	"emojis": "🛑 ⏱️",
	"explanation": "Limits calls per time window",
	"timeTaken": 18,
	"timestamp": "<serverTimestamp>",
	"autoSubmit": false
}
```

### users (collection)
Document ID is the participant USN (uppercase). Stores attempt metadata.

Example document:

```
{
	"usn": "1AB23CS456",
	"startedAt": "<serverTimestamp>",
	"lastUpdatedAt": "<serverTimestamp>",
	"hasCompleted": true,
	"completedAt": "<serverTimestamp>"
}
```

## Firestore rules

`firestore.rules` is included with permissive read access for the admin panel and no Firebase Auth. Adjust before production.

## Run locally

```
npm install
npm run dev
```
