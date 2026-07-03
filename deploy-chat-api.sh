#!/bin/bash
# ==============================================================================
# This script applies the IAM permissions and Secrets required for the Chat backend
# to function properly without 403 Forbidden or CORS issues.
# ==============================================================================

# 1. Set the GEMINI_API_KEY in Firebase Secrets
echo "Setting Gemini API Key in Firebase Secrets..."
echo "AIzaSyDIireoSFPwo4Ylkzhjr02eua4wcCfcJzU" | firebase functions:secrets:set GEMINI_API_KEY --project=asinghpm101

# 2. Deploy the Cloud Function
echo "Deploying the 'chat' Cloud Function..."
firebase deploy --only functions:chat --project=asinghpm101

# 3. Explicitly Ensure Public IAM Binding (Fix for 403 / CORS)
echo "Ensuring public access is granted to bypass 403 Forbidden / CORS errors..."
gcloud run services add-iam-policy-binding chat \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  --project=asinghpm101 || echo "Note: gcloud CLI might not be authenticated. You can also allow unauthenticated invocations via the Google Cloud Console."

echo "✅ Deployment and permissions setup complete."
