#!/bin/bash
rm -rf docs
rm -rf _site
bundle install
JEKYLL_ENV=production bundle exec jekyll b
mv _site docs
