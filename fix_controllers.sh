#!/bin/bash
# Fix all controllers to support req.schoolId from tenant middleware
# Run on server: bash /www/wwwroot/be-school-new/fix_controllers.sh

cd /www/wwwroot/be-school-new/controllers

echo "Fixing controllers..."

# Fix pattern: const { schoolId } = req.query;
for file in *.js; do
  if grep -q "req.schoolId || req.query.schoolId" "$file"; then
    echo "SKIP: $file (already fixed)"
    continue
  fi

  # Try direct sed replacement
  if sed -i 's/const { schoolId } = req\.query;/const schoolId = req.schoolId || req.query.schoolId;/g' "$file" 2>/dev/null; then
    echo "FIXED: $file"
  else
    echo "NEED MANUAL: $file"
  fi
done

echo "Done!"
echo ""
echo "Restart PM2:"
echo "export PATH=\$HOME/.npm-global/bin:\$PATH && /home/ubuntu/.npm-global/bin/pm2 restart be-school-new"
