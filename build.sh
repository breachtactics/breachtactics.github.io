#!/bin/bash
bundle install
JEKYLL_ENV=production bundle exec jekyll b
mv _site docs
