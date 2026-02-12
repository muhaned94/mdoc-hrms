@echo off
echo Deploying to GitHub...
git add . && git commit -m "feat: implement grade-specific course logic, fix settings crash, and restore bonus/deduction UI" && git push && (
    echo Done! Deployment successful.
) || (
    echo Error: Deployment failed. Please check your git status or connection.
)
pause
