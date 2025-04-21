run: docker-build docker-run

update:
    npm update --latest
    rm -rf node_modules
    npm install

lint:
    trunk check --all --fix -y

docker-build:
    # Use buildx to build for multiple platforms and load the native one
    docker buildx build --platform linux/amd64,linux/arm64 -t linkus-app --load .

docker-run:
    rm configtest/config.yaml || true
    docker rm -f linkus || true
    docker run --rm -p 3000:3000 \
    -e PORT=3000 \
    -v $(pwd)/configtest:/app/config \
    --name linkus \
    linkus-app
