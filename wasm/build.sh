mv ./.cargo/worker.config.toml ./.cargo/config.toml
wasm-pack build --target web --out-dir build/worker
mv ./.cargo/config.toml ./.cargo/worker.config.toml 
wasm-pack build --target web --out-dir build/main
