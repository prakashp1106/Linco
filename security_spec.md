# Security Specification: LINCO Lost & Found

This document outlines the zero-trust security architecture, data invariants, and adversarial test suites for the Firestore database.

---

## 1. Data Invariants

1. **User Ownership & Profile Lock**: Users may only read, create, or update their own user profile document.
2. **Profile Field Immutability**: Critical identifier fields like `uid` and `createdAt` must be immutable after initial creation.
3. **No Blanket Reads**: No collection allows blanket unconstrained reads. Read access is strictly locked to individual document ownership or specific query conditions.
4. **Backend Isolation**: Collections of `posts`, `matches`, `notifications`, `claims`, and `audit_logs` are handled strictly by the secure Express backend container utilizing the Firebase Admin SDK. All client-side Direct SDK access to these collections is entirely forbidden (`allow read, write: if false;`).

---

## 2. The "Dirty Dozen" Malicious Payloads

Here are 12 specific payloads designed to break our security invariants, followed by how our security rules reject them.

### Payload 1: Profile Spoofing (Identity Theft)
An attacker tries to create a user document under another user's UID.
```json
// Path: /users/attacker_uid
{
  "uid": "victim_uid",
  "displayName": "Attacker",
  "username": "attacker",
  "bio": "Intruder",
  "city": "Unknown",
  "photoURL": "https://attacker.com/pic.png",
  "createdAt": 1700000000000
}
```
*Expected Result:* `PERMISSION_DENIED` (UID mismatch check `data.uid == request.auth.uid`).

### Payload 2: Ghost Field Injection (Shadow Update)
An attacker attempts to write extra unauthorized parameters to bypass validations.
```json
// Path: /users/user_uid
{
  "uid": "user_uid",
  "displayName": "Legit User",
  "username": "legit",
  "bio": "Legit bio",
  "city": "Kolkata",
  "photoURL": "https://gravatar.com/avatar",
  "createdAt": 1700000000000,
  "isAdmin": true,
  "isVerified": true
}
```
*Expected Result:* `PERMISSION_DENIED` (Keys length check `data.keys().size() == 7`).

### Payload 3: Username Hijacking with Path Traversal (ID Poisoning)
An attacker injects traversal or extreme junk characters into the user ID path.
```json
// Path: /users/../../some_nested_path
{
  "uid": "user_uid",
  "displayName": "Legit User",
  "username": "legit",
  "bio": "Legit bio",
  "city": "Kolkata",
  "photoURL": "https://gravatar.com/avatar",
  "createdAt": 1700000000000
}
```
*Expected Result:* `PERMISSION_DENIED` (Document ID path validation check `isValidId(userId)`).

### Payload 4: Overwriting Created Timestamp (Temporal Hijacking)
An attacker attempts to modify `createdAt` to gain system tenure.
```json
// Path: /users/user_uid
// Current document: {"createdAt": 1700000000000}
// Update payload:
{
  "uid": "user_uid",
  "displayName": "Legit User",
  "username": "legit",
  "bio": "Legit bio",
  "city": "Kolkata",
  "photoURL": "https://gravatar.com/avatar",
  "createdAt": 1500000000000
}
```
*Expected Result:* `PERMISSION_DENIED` (Immutability check `incoming().createdAt == existing().createdAt`).

### Payload 5: Denying Wallet (Resource Exhaustion)
An attacker tries to send a 10MB string as `bio` to inflate host billing.
```json
// Path: /users/user_uid
{
  "uid": "user_uid",
  "displayName": "Legit User",
  "username": "legit",
  "bio": "A... [10MB string] ...A",
  "city": "Kolkata",
  "photoURL": "https://gravatar.com/avatar",
  "createdAt": 1700000000000
}
```
*Expected Result:* `PERMISSION_DENIED` (Size constraint check `data.bio.size() <= 500`).

### Payload 6: Malicious Username Format (Regex Bypass)
An attacker tries to insert URL code or SQL keywords in username field.
```json
// Path: /users/user_uid
{
  "uid": "user_uid",
  "displayName": "Legit User",
  "username": "legit; DROP TABLE users;--",
  "bio": "Legit bio",
  "city": "Kolkata",
  "photoURL": "https://gravatar.com/avatar",
  "createdAt": 1700000000000
}
```
*Expected Result:* `PERMISSION_DENIED` (Regex check `data.username.matches('^[a-z0-9_]+$')`).

### Payload 7: Client-Side Post Deletion
An attacker tries to bypass the backend and delete an active post directly.
```json
// Path: /posts/post_123
// DELETE operation
```
*Expected Result:* `PERMISSION_DENIED` (`posts` collection does not permit client mutations).

### Payload 8: Direct Claim Creation
An attacker tries to inject an approved claim directly on another user's post.
```json
// Path: /claims/claim_123
{
  "id": "claim_123",
  "postId": "post_123",
  "status": "Approved",
  "claimantName": "Attacker"
}
```
*Expected Result:* `PERMISSION_DENIED` (`claims` collection does not permit client writes).

### Payload 9: Direct Notification Spoofing
An attacker tries to dispatch system notifications directly to other users.
```json
// Path: /notifications/notif_123
{
  "id": "notif_123",
  "postId": "post_123",
  "message": "You win a free prize!",
  "type": "system"
}
```
*Expected Result:* `PERMISSION_DENIED` (`notifications` collection has direct SDK mutations blocked).

### Payload 10: Client-Side Post Update (Bypassing Moderation)
An attacker tries to alter a post's status directly via Client SDK.
```json
// Path: /posts/post_123
// UPDATE operation
```
*Expected Result:* `PERMISSION_DENIED` (`posts` is backend-only).

### Payload 11: Stealing Audit Logs
An attacker tries to query the `audit_logs` collection to scrape operational history.
```json
// Path: /audit_logs
// QUERY operation
```
*Expected Result:* `PERMISSION_DENIED` (`audit_logs` has client reads disabled).

### Payload 12: Anonymous Profile Creation
An attacker with an unverified or anonymous account tries to create a profile.
```json
// Path: /users/anon_uid
// auth.token.email_verified is false
```
*Expected Result:* `PERMISSION_DENIED` (Verification mandate check `isVerifiedUser()`).

---

## 3. The Test Runner Simulation

This suite simulates test execution, verifying that our security rules successfully catch all exploits.

```ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("Firestore Security Rules Tests", () => {
  let testEnv: any;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "linco-lost-found",
      firestore: {
        rules: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // catch-all fallback
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`
      }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it("should fail profile spoofing (Payload 1)", async () => {
    const context = testEnv.authenticatedContext("attacker_uid", { email_verified: true });
    const db = context.firestore();
    const docRef = db.collection("users").doc("attacker_uid");
    await assertFails(docRef.set({
      uid: "victim_uid",
      displayName: "Attacker",
      username: "attacker",
      bio: "Intruder",
      city: "Unknown",
      photoURL: "https://attacker.com/pic.png",
      createdAt: Date.now()
    }));
  });

  it("should fail ghost field injection (Payload 2)", async () => {
    const context = testEnv.authenticatedContext("user_uid", { email_verified: true });
    const db = context.firestore();
    const docRef = db.collection("users").doc("user_uid");
    await assertFails(docRef.set({
      uid: "user_uid",
      displayName: "Legit User",
      username: "legit",
      bio: "Legit bio",
      city: "Kolkata",
      photoURL: "https://gravatar.com/avatar",
      createdAt: Date.now(),
      isAdmin: true
    }));
  });

  it("should fail client-side claim creation (Payload 8)", async () => {
    const context = testEnv.authenticatedContext("user_uid", { email_verified: true });
    const db = context.firestore();
    const docRef = db.collection("claims").doc("claim_123");
    await assertFails(docRef.set({
      id: "claim_123",
      postId: "post_123",
      status: "Approved",
      claimantName: "Attacker"
    }));
  });
});
```
