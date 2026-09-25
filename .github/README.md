# GitHub Actions

The workflow in `workflows/qa.yml` runs the Elega quality checks for pull requests and pushes to `main`.

Configure these repository secrets before enabling the backend and Selenium job:

- `QA_SUPABASE_URL`
- `QA_SUPABASE_ANON_KEY`
- `QA_SUPABASE_SERVICE_ROLE_KEY` (needed by admin or staff integration tests)

These values must belong to a dedicated QA Supabase project. Never use production Supabase credentials in CI.

The workflow builds the frontend, starts the backend and frontend locally on the GitHub runner, runs API tests, then runs Selenium smoke tests in headless Chrome. Test reports and failure screenshots are uploaded as workflow artifacts.
