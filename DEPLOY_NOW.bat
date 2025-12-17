@echo off
echo Deploying to GitHub...
git add . && git commit -m "Final Manual Push - Fix Settings and Loading" && git push && (
    echo Done! Deployment successful.
) || (
    echo Error: Deployment failed. Please check your git status or connection.
)
pause
