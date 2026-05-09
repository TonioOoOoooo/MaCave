@echo off
rem Script Git pour ajouter tous les fichiers (nouveaux et modifiés)

rem Afficher l'état actuel
git status

rem Demander un message de commit
set /p commit_message="Entrez votre message de commit : "

rem Ajouter tous les fichiers (nouveaux, modifiés, supprimés)
git add -A

rem Créer un commit avec le message fourni
git commit -m "%commit_message%"

rem Pousser les changements vers le dépôt distant
git push origin main

echo Changements committés et poussés avec succès!
pause