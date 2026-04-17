# Digital Hub Myanmar - Points System Documentation

## Overview

The Points System is a comprehensive rewards and loyalty program that allows users to earn points through various activities and redeem them for rewards. This document outlines the implementation, database schema, and usage instructions.

## Features

### 1. **Referral System**
- Users can share their referral code/link with friends
- When a referred user makes a purchase, the referrer earns points
- Points earned: 10% of purchase amount (minimum 100 points)
- Detailed tracking of all invitees and their purchase history

### 2. **Points History**
- Complete transaction log with date, time, and labels
- Tracks all earning sources: referral purchases, own purchases, task completions
- Shows previous and new balance for each transaction
- Displays current balance, highest points claimed, and total used points

### 3. **Redeem System**
- Admin-managed rewards that users can redeem with points
- Each reward item has:
  - Name and description
  - Required points
  - Optional time limit
  - Optional spots limit (availability)
  - Active/Inactive status
- Users cannot redeem if they don't have enough points
- Redeem requests are tracked and can be managed by admin

### 4. **Tasks System**
- Admin-created tasks that users can complete for points
- Each task has:
  - Name and description
  - Reward points
  - Optional deadline
  - Active/Inactive status
- Users can claim a task only once
- Tasks with passed deadlines cannot be claimed
- Edit/Remove operations on tasks don't affect users who already claimed them

## Database Schema

### Collections

#### `points_history`
```javascript
{
  user_id: string,
  points: number,
  label: string,
  type: 'earn' | 'use',
  metadata: object,
  created_at: timestamp,
  previous_balance: number,
  new_balance: number
}
```

#### `redeem_items`
```javascript
{
  name: string,
  description: string,
  required_points: number,
  time_limit: string (optional),
  spots_limit: number (optional),
  redeemed_count: number,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### `tasks`
```javascript
{
  name: string,
  description: string,
  reward_points: number,
  deadline: date (optional),
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### `user_task_claims`
```javascript
{
  user_id: string,
  username: string,
  task_id: string,
  task_name: string,
  reward_points: number,
  claimed_at: timestamp
}
```

#### `redeem_requests`
```javascript
{
  user_id: string,
  username: string,
  email: string,
  redeem_item_id: string,
  redeem_item_name: string,
  points_used: number,
  status: 'pending' | 'completed' | 'cancelled',
  created_at: timestamp,
  updated_at: timestamp
}
```

#### `referral_transactions`
```javascript
{
  referrer_id: string,
  buyer_id: string,
  purchase_amount: number,
  points_earned: number,
  product_name: string,
  created_at: timestamp
}
```

#### `users` (Updated fields)
```javascript
{
  // ... existing fields ...
  points_balance: number,
  highest_points_claimed: number,
  total_used_points: number,
  total_referral_earnings: number
}
```

## API Endpoints

### User Endpoints

#### Award Referral Points
- **URL:** `/api/user/award-referral-points`
- **Method:** POST
- **Body:**
  ```json
  {
    "referrerId": "user_id",
    "buyerId": "user_id",
    "purchaseAmount": 50000,
    "productName": "Product Name"
  }
  ```
- **Response:** Success message with points earned and new balance

#### Claim Task
- **URL:** `/api/user/claim-task`
- **Method:** POST
- **Body:**
  ```json
  {
    "userId": "user_id",
    "taskId": "task_id"
  }
  ```
- **Response:** Success message with points earned and new balance

#### Redeem Item
- **URL:** `/api/user/redeem`
- **Method:** POST
- **Body:**
  ```json
  {
    "userId": "user_id",
    "redeemItemId": "item_id"
  }
  ```
- **Response:** Success message with new balance

### Admin Endpoints

#### Manage Redeem Items
- **URL:** `/api/admin/redeem-items`
- **Methods:** GET, POST, PUT, DELETE
- **GET:** Fetch all redeem items
- **POST:** Create new redeem item
- **PUT:** Update existing redeem item
- **DELETE:** Delete redeem item

#### Manage Tasks
- **URL:** `/api/admin/tasks`
- **Methods:** GET, POST, PUT, DELETE
- **GET:** Fetch all tasks
- **POST:** Create new task
- **PUT:** Update existing task
- **DELETE:** Delete task

## Frontend Components

### Dashboard Pages

#### `/dashboard` (Main Dashboard)
Enhanced with 4 tabs:

1. **Referral Tab**
   - Display referral code and invite link
   - Copy buttons for easy sharing
   - Summary stats: Total invites, Total purchased amount
   - Detailed invitee list with purchase history

2. **Points History Tab**
   - Current balance display
   - Highest points claimed
   - Total used points
   - Complete transaction history table

3. **Redeem Tab**
   - Grid of available redeem items
   - Shows required points, time limit, spots limit
   - Redeem button (disabled if insufficient points)

4. **Tasks Tab**
   - List of available tasks
   - Shows reward points and deadline
   - Claim button (disabled if already claimed)

### Admin Pages

#### `/admin/rewards`
Rewards management interface with 2 tabs:

1. **Redeem Items Tab**
   - Add new redeem items
   - Edit existing items
   - Delete items
   - View all items with status

2. **Tasks Tab**
   - Add new tasks
   - Edit existing tasks
   - Delete tasks
   - View all tasks with status

## Integration Points

### When a User Makes a Purchase
1. Order is created in checkout
2. After order completion, call `/api/user/award-referral-points` if user was referred
3. Points are automatically added to referrer's account
4. Transaction is logged in `points_history`

### When a User Claims a Task
1. User clicks "Claim" button on task
2. API validates task deadline and previous claims
3. Points are added to user's account
4. Transaction is logged
5. Claim is recorded in `user_task_claims`

### When a User Redeems an Item
1. User clicks "Redeem" button on item
2. API validates sufficient points and availability
3. Points are deducted from user's account
4. Transaction is logged
5. Redeem request is created for admin review

## Utility Functions

### `src/utils/pointsSystem.js`

#### `logPointsTransaction(userId, points, label, type, metadata)`
Logs a points transaction and updates user balance.

#### `getUserPointsHistory(userId)`
Fetches all points history for a user.

#### `getRedeemItems()`
Fetches all active redeem items.

#### `getTasks()`
Fetches all active tasks.

## Error Handling

- Insufficient points: Returns 400 error
- Item/task not found: Returns 404 error
- Already claimed task: Returns 400 error
- Deadline passed: Returns 400 error
- Out of stock: Returns 400 error

## Future Enhancements

1. **Admin Dashboard for Redeem Requests**
   - View pending redeem requests
   - Mark as completed/cancelled
   - Track fulfillment status

2. **Points Expiration**
   - Set expiration dates for earned points
   - Automatic cleanup of expired points

3. **Tiered Rewards**
   - Different point values based on membership level
   - VIP users earn more points

4. **Notifications**
   - Email/SMS notifications for points earned
   - Redeem status updates

5. **Leaderboard**
   - Top earners display
   - Monthly/yearly rankings

## Testing Checklist

- [ ] User can view referral code and copy it
- [ ] Referral link includes correct code
- [ ] Invitee list shows all referred users with purchase history
- [ ] Points history displays all transactions correctly
- [ ] Current balance updates after redeem
- [ ] Cannot redeem with insufficient points
- [ ] Cannot claim same task twice
- [ ] Task deadline validation works
- [ ] Admin can add/edit/delete redeem items
- [ ] Admin can add/edit/delete tasks
- [ ] Redeem requests are created and tracked
- [ ] Task claims are recorded correctly
- [ ] Referral points are awarded on purchase

## Notes

- All timestamps use Firestore server timestamps for consistency
- Points calculations use Math.floor for integer values
- Minimum referral points: 100 points
- All monetary amounts are in MMK (Myanmar Kyat)
