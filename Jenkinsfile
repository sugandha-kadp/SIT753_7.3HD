pipeline {
  agent any

  environment {
    DIRECTORY_PATH = "${env.WORKSPACE}"
    TESTING_ENVIRONMENT = "Courseflow-Staging"
    PRODUCTION_ENVIRONMENT = "Courseflow-Production"
    NAME = "Piyum Sugandha"
    APP_NAME = "courseflow"
    ARTIFACT_DIR = "build"
    RELEASE_DIR = "release"
    SERVER_PORT = "4173"
    SERVER_LOG_DIR = ".jenkins"
  }

  options {
    timestamps()
  }

  stages {
    stage('Build') {
      steps {
        echo "Fetch the source code from ${DIRECTORY_PATH}"
        echo "Compile the code and generate any necessary artifacts"
        sh '''
          set -e
          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install
          fi
          mkdir -p ${ARTIFACT_DIR}
          npm pack --pack-destination ${ARTIFACT_DIR}
          ARTIFACT=$(ls ${ARTIFACT_DIR}/${APP_NAME}-*.tgz | head -n 1)
          mv "$ARTIFACT" "${ARTIFACT_DIR}/${APP_NAME}-${BUILD_NUMBER}.tgz"
        '''
        archiveArtifacts artifacts: "${ARTIFACT_DIR}/*.tgz", fingerprint: true
      }
    }

    stage('Test') {
      steps {
        echo "Running automated API tests"
        sh 'npm run test:api'
      }
    }

    stage('Code Quality Check') {
      steps {
        echo "Check the quality of the code"
        sh '''
          set -e
          cat <<'EOF' > .eslintrc.ci.json
          {
            "env": { "browser": true, "node": true, "es2021": true },
            "parserOptions": { "ecmaVersion": 2021, "sourceType": "module" },
            "extends": ["eslint:recommended"],
            "rules": {
              "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "ignored" }],
              "no-empty": "off"
            }
          }
          EOF
          npx --yes eslint@8.57.0 -c .eslintrc.ci.json "src/**/*.js"
        '''
      }
      post {
        always {
          sh 'rm -f .eslintrc.ci.json'
        }
      }
    }

    stage('Security') {
      steps {
        echo "Scanning dependencies for vulnerabilities"
        sh 'npm audit --omit=dev --audit-level=high'
      }
    }

    stage('Deploy') {
      steps {
        echo "Deploy the application to a testing environment: ${TESTING_ENVIRONMENT} by ${NAME}"
        sh '''
          set -e
          mkdir -p ${SERVER_LOG_DIR}
          node testing/e2e/server-with-memory.js > ${SERVER_LOG_DIR}/app.log 2>&1 &
          echo $! > ${SERVER_LOG_DIR}/server.pid
          sleep 10
        '''
      }
    }

    stage('Approval') {
      steps {
        echo "Waiting for approval before promotion"
        sleep(time: 10, unit: 'SECONDS')
      }
    }

    stage('Deploy to Production') {
      steps {
        echo "Deploy the code to the production environment: ${PRODUCTION_ENVIRONMENT} by ${NAME}"
        sh '''
          set -e
          mkdir -p ${RELEASE_DIR}
          cp ${ARTIFACT_DIR}/${APP_NAME}-${BUILD_NUMBER}.tgz ${RELEASE_DIR}/${APP_NAME}-production-${BUILD_NUMBER}.tgz
          cat <<EOF > ${RELEASE_DIR}/manifest.json
          {
            "buildNumber": "${BUILD_NUMBER}",
            "commit": "${GIT_COMMIT}",
            "artifact": "${APP_NAME}-${BUILD_NUMBER}.tgz",
            "releasedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          }
          EOF
        '''
        archiveArtifacts artifacts: "${RELEASE_DIR}/*", fingerprint: true
      }
    }

    stage('Monitoring') {
      steps {
        echo "Verify health checks and capture logs after production deployment"
        sh '''
          set -e
          curl --retry 5 --retry-delay 3 -sf http://localhost:${SERVER_PORT}/ -o ${SERVER_LOG_DIR}/healthcheck.html
          tail -n 50 ${SERVER_LOG_DIR}/app.log || true
        '''
        archiveArtifacts artifacts: "${SERVER_LOG_DIR}/healthcheck.html", allowEmptyArchive: true
      }
    }
  }

  post {
    always {
      sh '''
        if [ -f ${SERVER_LOG_DIR}/server.pid ]; then
          kill $(cat ${SERVER_LOG_DIR}/server.pid) || true
        fi
        rm -rf ${SERVER_LOG_DIR}
      '''
    }
  }
}
