# 🚀 Fashion Hub: Ultimate Deployment Guide

Congratulations on completing the Fashion Hub application! Because this is a **Full-Stack Application** consisting of a database, a backend API server, and a frontend interface, you will need to deploy each component to the cloud so they can communicate seamlessly.

Follow these step-by-step instructions exactly to host your website live!

---

## 🟢 Step 1: Deploy Database (MongoDB Atlas)
Right now, your data lives in local storage (`127.0.0.1:27017`). We need to move it to the cloud.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Build a new free cluster (M0 sandbox).
3. Under **Database Access**, create a database user (username and password). *Save this password!*
4. Under **Network Access**, add the IP address `0.0.0.0/0` so your cloud backend can connect anywhere.
5. Click **Connect** on your cluster, choose **Connect your application**, and copy the **Connection String**.
   * It will look like: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/fashionhub?retryWrites=true&w=majority`

---

## 🔵 Step 2: Deploy Backend (Render)
Render is a free and reliable host for Node.js / Express servers.

1. Create a free account on [Render](https://render.com/).
2. Push your `fashion-hub` folder to a new **GitHub Repository**.
3. On Render, click **New +** > **Web Service**.
4. Connect your GitHub account and select your `fashion-hub` repository.
5. Configure the Build settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Open **Environment Variables** on Render and insert these exact keys:
   - `MONGO_URI`: *(Paste the MongoDB Atlas string from Step 1, remember to replace `<password>` with the real password)*
   - `JWT_SECRET`: `super_secret_fashion_key_123`
   - `EMAIL_USER`: `fashionhubtryon@gmail.com`
   - `EMAIL_PASS`: *(Your 16-character Gmail App Password)*
   - `FRONTEND_URL`: *(Leave blank for now, you will update this in Step 3)*
7. Click **Create Web Service**. Wait 2-3 minutes for the build to pass.
8. Once live, Render will give you a public URL (e.g., `https://fashion-hub-api.onrender.com`). **Copy this URL.**

---

## 🟣 Step 3: Deploy Frontend (Vercel or Netlify)
Finally, we host the static Vanilla HTML/JS frontend.

### Pre-Deployment Check:
Before pushing to GitHub, you **must route the frontend to the live backend URL**.
1. Open `frontend/js/state.js` in your code editor.
2. Locate the following line:
   ```javascript
   export const API_URL = isLocal ? 'http://localhost:5000' : 'https://fashion-hub-api.onrender.com';
   ```
3. Replace `'https://fashion-hub-api.onrender.com'` with the exact backend URL you copied from Step 2.
4. Commit and push this change to GitHub.

### Deploying to Netlify:
1. Go to [Netlify](https://www.netlify.com/) and log in with GitHub.
2. Click **Add new site** > **Import an existing project**.
3. Select your `fashion-hub` repository.
4. Configure Build settings:
   - **Base directory**: `frontend`
   - **Publish directory**: `frontend`
   - **Build command**: *(Leave blank)*
5. Click **Deploy Site**. Netlify will give you a live HTTPS link (e.g., `https://fashion-hub.netlify.app`).

### Final Link Sync!
Go back to your **Render Backend Web Service** > **Environment Variables** and update `FRONTEND_URL` to the exact Netlify URL you just got. This ensures CORS headers and password-reset links resolve perfectly to your live website.

---

### 🎉 You Are Done!
Your site is live! You can now visit your Netlify URL and shop from anywhere in the world!
