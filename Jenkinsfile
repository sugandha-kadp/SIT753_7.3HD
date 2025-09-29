pipeline {
  agent any

  options { timestamps() }

  environment {
    APP_NAME               = "courseflow"
    ARTIFACT_DIR           = "build"
    TESTING_ENVIRONMENT    = "Courseflow-Staging"
    PRODUCTION_ENVIRONMENT = "Courseflow-Production"
    NAME                   = "Piyum Sugandha"
  }

  stages {

    stage('Build') {
      steps {
        echo "Starting Build stage"
        sh '''
          set -e
          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi
          mkdir -p ${ARTIFACT_DIR}
          echo "Build complete"
        '''
        echo "Build stage completed"
      }
    }

    stage('Test') {
      steps {
        echo "Starting Test stage"
        sh '''
          set -e
          if npm run | grep -q " test"; then
            npm test
          else
            echo "No 'test' script defined in package.json. Failing stage."
            exit 1
          fi
        '''
        echo "Test stage completed"
      }
    }

    stage('Code Quality') {
      steps {
        echo "Starting Code Quality stage"
        sh '''
          set -e
          if npm run | grep -q " lint"; then
            npm run lint
          elif command -v sonar-scanner >/dev/null 2>&1; then
            sonar-scanner
          else
            echo "No code quality tooling configured (expected npm 'lint' script or sonar-scanner)."
            exit 1
          fi
        '''
        echo "Code Quality stage completed"
      }
    }

    stage('Security') {
      steps {
        echo "Starting Security stage"
        sh 'echo "Security placeholder finished"'
      }
    }

    stage('Deploy') {
      steps {
        echo "Starting Deploy stage"
        sh 'echo "Deploy placeholder finished"'
      }
    }

    stage('Release') {
      steps {
        echo "Starting Release stage"
        sh 'echo "Release placeholder finished"'
      }
    }

    stage('Monitoring') {
      steps {
        echo "Starting Monitoring stage"
      }
    }
  }

  post {
    success { echo "Pipeline finished successfully" }
    failure { echo "Pipeline failed. Check logs." }
    always  { echo "Post actions complete" }
  }
}
