# Sender-frontend
This is the user interface for the rshake device sender web application which is the client-side code served as static html files by the backend. It is the front-end component of the web application, used by citizen scientists, that provides a graphical interface for configuring and managing their rShake devices.

For device rollout, frontend image updates are orchestrated by the host `sender-backend UPDATE_STACK` flow. The host updater targets `SENDER_BUNDLE_TAG` (default `latest`) and resolves the frontend image tag to a digest before deployment.

### Development Setup
To run this repository on your local machine, please follow the instructions provided under the [Setting Up The Repository On Your Local Machine](CONTRIBUTING.md#setting-up-the-repository-on-your-local-machine) section of the [contributing.md](CONTRIBUTING.md).
