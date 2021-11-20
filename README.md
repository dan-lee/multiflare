# multiflare

Run multiple simulated [Cloudflare Workers](https://workers.cloudflare.com/) in your project with `multiflare` utilizing [the amazing `miniflare`](https://v2.miniflare.dev/) and its [`mount` option](https://v2.miniflare.dev/mount.html#mounting-workers) 🚀 

This is useful if you have a lot of workers to orchestrate; maybe even in a monorepo. The workers can have their individual configuration in their own `wrangler.toml`.

## 🤔 Motivation

Having to deal with multiple workers can be difficult, especially if you want to simulate near-production environment regarding domains.

Multiflare makes this possible with some basic setup required though.

<img src="./multiflare.png" alt="">

All code examples in this readme are based off [the example in this repository](https://github.com/dan-lee/multiflare/tree/main/example/my-workshop/workers) 

## 📥 Installation

Let's go! 👏

```sh
yarn add multiflare --dev

# or

npm i --save-dev multiflare
```

## 🧑‍🔧 Usage

🏃 Running `multiflare` is easy:

```sh
yarn multiflare ./example/my-workshop/workers
```

It requires some setup though:

## 🔧 Setup

Put all your workers as subdirectory in a common directory with their respective `wrangler.toml` files. Like so:

```
my-workshop/
└── workers
    ├── api
    │   ├── wrangler.toml
    │   └── …
    ├── website
    │   ├── wrangler.toml
    │   └── …
    └── account
        ├── wrangler.toml
        └── …
```

## 🔀 Add local domain handling

To simulate production environment it's useful to have a similar domain locally.

For example if your production domain is `my-workshop.io` you can easily add `my-workshop.test` domain to your local machine just to have a similar environment.

### Simple setup for pre-defined subdomains

Open and modify `/etc/hosts`:

```sh
# Append to file
127.0.0.1 my-workshop.test www.my-workshop.test
127.0.0.1 api.my-workshop.test
127.0.0.1 account.my-workshop.test
```

<details>
<summary><b>Advanced setup for any domain (catch all)</b></summary>

This describes the case for all `*.test` domains:

1. Install [`dnsmasq`](https://thekelleys.org.uk/dnsmasq/doc.html): `brew install dnsmasq` (installation differs depending on your system)
2. Add following line to `/usr/local/etc/dnsmasq.conf`:

```
address=/test/127.0.0.1
```

3. Add following to `/etc/resolv.conf`

```
search test
nameserver 127.0.0.1
```

4. Add file `/etc/resolver/test` with this line `nameserver 127.0.0.1`
</details>



### Configure `wrangler.toml` of the workers

Put your domain(s) into the `[env.dev]` section, so `multiflare` is able to pick it up.

`…/api/wrangler.toml`:
```toml
name = "api"

# 👇 This is key
[env.dev]
route = "api.my-workshop.test/*"

[env.production]
route = "api.my-workshop.io/*"
```

`…/website/wrangler.toml`:


```toml
name = "website"

# 👇 This is key
[env.dev]
routes = ["my-workshop.test/*", "www.my-workshop.test/*"]

[env.production]
routes = ["my-workshop.io/*", "www.my-workshop.io/*"]
```

**Now you should be ready to run `multiflare`! 👌** 

```sh
yarn miniflare ./examples/my-workshop/workers
```

Phew! That was a lot to take in. If you have any questions or something is not clear, please feel free to open an issue.


## CLI
@todo

## API
@todo
