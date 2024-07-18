for file in ./wrappers/*.compile.ts; do
    filename=$(basename "$file" .compile.ts)
    echo "$filename"
    npx blueprint build "$filename"
done