These are the workers orchestrated by `multiflare`.

**api**:

```toml
name = "api"

[env.dev]
route = "api.my-workshop.test"
```

**account**:

```toml
name = "account"

[env.dev]
route = "account.my-workshop.test"
```

**website**:

```toml
name = "website"

[env.dev]
routes = ["my-workshop.test", "www.my-workshop.test"]
```
