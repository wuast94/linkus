run: docker-build docker-run

update:
    rm -rf node_modules
    npm install

docker-build:
    docker build --no-cache -t linkus-app .

docker-run:
    rm configtest/config.yaml || true
    docker rm -f linkus || true
    docker run --rm -p 3000:3000 \
    -e PORT=3000 \
    -v $(pwd)/config:/app/config \
    --name linkus \
    linkus-app
