import os

base_dir = "/home/thanish/.gemini/antigravity/scratch/cybermind-os/services"
services = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]

for service in services:
    main_ts_path = os.path.join(base_dir, service, "src", "main.ts")
    
    if not os.path.exists(main_ts_path):
        continue

    with open(main_ts_path, 'r') as f:
        content = f.read()

    if "setupObservability" in content:
        continue

    service_name = f"{service}-service"
    # Calculate relative path from services/X/src/main.ts to packages/sdk/observability-client/src
    rel_path = "../../../packages/sdk/observability-client/src"

    new_imports = f"import {{ initializeOpenTelemetry, setupObservability }} from '{rel_path}';\ninitializeOpenTelemetry('{service_name}');\n"
    
    lines = content.split('\n')
    new_lines = [new_imports]
    inserted = False
    
    for line in lines:
        if line.startswith("import { initializeOpenTelemetry") or line.startswith("import { setupObservability") or line.startswith("initializeOpenTelemetry"):
            continue
        new_lines.append(line)
        if "app.setGlobalPrefix('api');" in line or (not inserted and "const app = await NestFactory.create(AppModule);" in line and "setGlobalPrefix" not in content):
            new_lines.append(f"  setupObservability(app, '{service_name}');")
            inserted = True
            
    with open(main_ts_path, 'w') as f:
        f.write('\n'.join(new_lines).replace('\n\n\n', '\n\n'))
    
    print(f"Updated {service} main.ts")
