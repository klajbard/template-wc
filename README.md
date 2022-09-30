# WC template project

This repo contains template for simple WC based webpages

## Dependencies

- [lit](https://github.com/lit/lit)

## Build tools

- Gulp, Rollup, Serverless plugins

## Files

### Build files

- gulpfile.js - contains the whole build process
- serverless.yml - contains sls template to deploy the project to s3 buckets

### Serverless deployment

- Install Serverless: `npm install -g serverless`
- Run serverless deployment: `yarn deploy`