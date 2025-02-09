## Setting Up The Repository On Your Local Machine
For local development, the sender-backend repository is needed to serve the requests from the frontend. As such, you need to spin up the backend code first, then the frontend.

1. Clone sender-backend, 
    ```bash
    git clone git@github.com:UPRI-earthquake/sender-backend.git
    ```
   1. Configure the back-end setup by creating a file named `.env`, containing the config variables. An example is available its `.env.example`. No need to change variable values.
   2. Install all dependencies via:
        ```bash
        npm install
        ```
   3. Build the image via:
        ```bash
        docker build -t ghcr.io/upri-earthquake/sender-backend:latest .
        ```
   4. Run the container via: 
        ```bash
        docker compose up
        ```  

2. Similar to above, clone this repository, 
    ```bash
    git clone git@github.com:UPRI-earthquake/sender-frontend.git
    ```
    1. Configure the sender-front-end setup by creating a file named `.env`, containing the config variables. An example is available on `.env.example`., making sure to put this value:
        ```bash
        REACT_APP_BACKEND_DEV=http://localhost:5000
        ```
    2. Install the dependencies via:
        ```bash
        npm install
        ```
    3. Build the image via:
        ```bash
        docker build -t ghcr.io/upri-earthquake/sender-frontend:latest .
        ```
    4. Run the container via:
        ```bash
        docker compose up
        ```
        See [this cheatsheet](https://upri-earthquake.github.io/docker-cheatsheet) for useful docker recipes.

## Publishing container image (For admins)
1. Build the image, and tag with the correct [semantic versioning](https://semver.org/): 
    > Note: replace X.Y.Z, and you should be at the same directory as the Dockerfile

    ```bash
    docker build -t ghcr.io/upri-earthquake/sender-frontend:X.Y.Z .
    ```
2. Push the image to ghcr.io:
    ```bash
    docker push ghcr.io/upri-earthquake/sender-frontend:X.Y.Z
    ```
    > ℹ️ Note: You need an access token to publish, install, and delete private, internal, and public packages in Github Packages. Refer to this [tutorial](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry) on how to authenticate to the container registry.

## Development Workflow: Creating New Feature
Please refer to the [contributing guide](https://upri-earthquake.github.io/dev-guide-contributing) to the entire EarthquakeHub suite.