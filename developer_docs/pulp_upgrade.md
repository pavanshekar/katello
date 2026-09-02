# Pulp Upgrade Guide

Pulp is Katello's content management backend, responsible for storing and syncing the actual content served by Katello. Pulp is a separate system service, meaning Katello's pulp bindings communicate with Pulp via a localhost REST API to orchestrate all content operations. 

Katello maintainers upgrade the y-version of Pulp and all Pulp plugins every two Katello releases (currently odd-numbered Katello y-versions). Pulp y-versions may only be updated with thorough testing, while Pulp z-versions may be updated with checks to the changelog. We do not typically re-record VCRs with Pulp z-version updates since the API should not change.

The following guide covers the workflow for upgrading Katello's containerized Pulp service using foremanctl development environments.

### Phase 1
Begin this phase no later than 1 month after Katello branching.

1. **Coordinate with Pulp team**: Alert the Pulp team to upgrade plans and request version recommendations. Ensure Pulpcore version has full plugin support.
2. **Check for breaking changes**: Review deprecations and functionality changes in the new Pulp version that may require Katello code changes.
3. **Backup your environment**: Create a snapshot of your quadlet VM or use a fresh foremanctl development environment.
4. **Update client bindings only**:
   - Update all `pulp-*-client` dependencies in `~/katello/katello.gemspec` using versions from [RubyGems](https://rubygems.org/)
   - In `~/foreman`, run `bundle update && bundle pristine`
   - Run Pulp tests: `bundle exec rake test TEST=../katello/test/services/pulp3/`
   - Check for failures (early warning for N-1 smart proxy sync issues)
5. **Build custom Pulp container with target versions**
   - Verify that Pulp packages are available on [PyPI](https://pypi.org/) for all versions you plan to pin in `requirements.txt`.
   - Check that `pulp-smart-proxy` supports the target pulpcore version. If the upper bound needs updating, submit a PR to update `pyproject.toml` in the pulp_smart_proxy repository.
   - Follow the [Building Custom Pulp Containers](https://github.com/theforeman/foremanctl/blob/master/docs/developer/development-environment.md#building-custom-pulp-containers) guide in foremanctl documentation to build a container with the target Pulp version.
6. **Deploy the custom Pulp container**
   
   Deploy the development environment with the custom Pulp image by passing extra variables:
   ```bash
   ./forge deploy-dev \
     --extra-vars pulp_container_image="<Red Hat registry>/pulp-development" \
     --extra-vars pulp_container_tag="<target-version>"
   ```
   
   This overrides the default Pulp container image settings. Database migrations run automatically during deployment via `pulpcore-manager-migrate.service`.
   
   **Alternative: Create a permanent override**
   
   To make this the default without typing it every time, add these variables to `~/foremanctl/development/vars/devel.yaml`:
   ```yaml
   httpd_foreman_backend: "http://localhost:3000/"
   pulp_container_image: <Red Hat registry>/pulp-development
   pulp_container_tag: "<target-version>"
   ```
   
   Then simply run `./forge deploy-dev` to automatically use the custom image.

7. **Verify Pulp versions are correct**: `curl -k https://quadlet.example.com/pulp/api/v3/status/ | jq '.versions[]'`

8. **Run a quick smoke test**: Try syncing content of all content types (RPM, container, deb, etc.)
9. **Request RPM builds**: Post to Foreman community requesting RPM builds for new Pulpcore & plugins. Anticipate 1 month for RPM builds. [Example](https://community.theforeman.org/t/request-for-pulpcore-3-85-builds/44413)

### Phase 2
Begin this phase once Pulp RPMs are ready.

1. **Run unit tests with new bindings**: Run unit tests with new Pulp client bindings but old VCR recordings
2. **Remove old monkey patches**: Check for N-1/N-2 patches that can be removed. N-1/N-2 testing will prove removal safety.
3. **Re-record VCRs**: Follow the VCR recording steps from [Testing & Code Quality - VCR Testing](./testing_and_code_quality.md#vcr-video-cassette-recorder-testing).
4. **File Pulp bugs**: Investigate errors and file any upstream issues.
5. **Test N-1 and N-2 compatibility**: Create smart proxies with last Pulp version (N-1) and previous (N-2). Test syncing with/without alternate content sources and updating content counts.
6. **Handle binding compatibility issues**: If new Pulp bindings don't work with older Pulp versions, create monkey patches as workarounds.

### Phase 3
Begin this phase once Pulp bugs and monkey patches are complete (or workable).

1. **Create Katello PR**: Include updated `katello.gemspec`, re-recorded VCRs, and code changes
2. **Create foreman-packaging PR for bindings**: Update Pulp bindings requirements for `rubygem-katello`. [Example](https://github.com/theforeman/foreman-packaging/pull/12547)
3. **Create foreman-packaging PR for client gems**: Update Pulp client binding gems to new versions (use `bump_rpms.sh`). [Example](https://github.com/theforeman/foreman-packaging/pull/12548)

### Phase 4

1. **Early Foreman/Katello/Smart Proxy Validation**
   - Point Robottelo to a box with upgraded packages (may be a developer box).
   - Run tests/modules related to content (Repositories, CVs) and smart proxy locally.
2. **Normal Foreman/Katello/Smart Proxy Validation**
   - Wait for RPMs in Stream.
   - Review normal pipeline results.
3. **N-1/N-2 Compatibility Testing**
   - Spin up older Foreman/Katello/smart proxy.
   - Register smart proxy and upgrade Foreman/Katello once or twice (to achieve N-1 or N-2).
   - Mock Robottelo smart proxy fixture to point at N-1/N-2 smart proxy.
   - Run smart proxy content tests (should work with older smart proxy).
   - Adjust timeouts as needed for Foreman/Katello versions used.
