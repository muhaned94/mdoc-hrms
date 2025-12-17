@echo off
echo Deploying to GitHub...
git add .
git commit -m "Final updates for production"
git push
echo Done! Vercel should update automatically.
pause
