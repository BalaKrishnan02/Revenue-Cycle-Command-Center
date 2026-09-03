@echo off
if exist "C:\tools\apache-maven-3.9.6\bin\mvn.cmd" (
    "C:\tools\apache-maven-3.9.6\bin\mvn.cmd" %*
) else (
    mvn %*
)
