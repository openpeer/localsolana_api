#!/bin/bash

# Loop through each CSV file in the current directory
for i in $(ls -1 | grep csv); do
  # Print the first few lines of the file
  echo "Processing file: $i"
  head -n 10 "$i"
done