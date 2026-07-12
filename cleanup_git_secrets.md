# git 履歴からシークレットを削除する手順

## 前提
- Supabase ダッシュボードで service_role キーのローテーションが完了していること
- Git リポジトリのルートで実行すること

## 手順

### 1. git-filter-repo のインストール
```
pip install git-filter-repo
```

### 2. 置換ファイルを作成（secrets.txt）
以下の内容で `secrets.txt` をプロジェクトルートに作成：
```
<旧キー文字列>==>REDACTED_SERVICE_ROLE_KEY
```
※ `<旧キー文字列>` の部分には、ローテーション前の実際のキー文字列を貼り付けてください（このファイルには記載しない）。

### 3. 履歴から削除を実行
```
git filter-repo --force --replace-text secrets.txt
```

### 4. force push（**既存の PR がある場合は要注意**）
```
git push origin main --force
```

### 5. secrets.txt を削除
```
del secrets.txt
```

## 備考
- GitHub の「Secret scanning」アラートが出ている場合は、ローテーション後に GitHub 側でアラートをクローズ
- リポジトリを一時的に Private に変更することを推奨
