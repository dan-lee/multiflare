#!/usr/bin/env node
import { Command } from 'commander'
import multiflare, { MultiflareOptions } from './multiflare.js'

const cli = new Command('multiflare')
  .argument('<directory>', 'Root directory of workers.')
  .option('--https', 'Serve via HTTPS. Be sure to also set --key and --cert')
  .option('--key <key>', 'Path to key file')
  .option('--cert <cert>', 'Path to cert file')
  .option(
    '-p, --port <port>',
    'Port where to serve from. Default: 80 for HTTP, 443 for HTTPS',
  )
  .option(
    '-l, --log-level <level>',
    `Log level: none, error, warn, info, debug, verbose`,
    'info',
  )

cli.parse(process.argv)

const options = cli.opts() as Omit<MultiflareOptions, 'rootDir'>

multiflare({
  rootDir: cli.args[0],
  ...options,
})
