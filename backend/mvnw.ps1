$mavenPath = "C:\tools\apache-maven-3.9.6\bin\mvn.cmd"
if (Test-Path $mavenPath) {
    & $mavenPath @args
} else {
    mvn @args
}
