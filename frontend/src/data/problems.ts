import type { Problem } from "../types/problem";

/**
 * MVP problem set, managed in-repo per 要件 9.2 (Git-based content management).
 * Each problem's schema/seed run in an isolated in-browser SQLite instance.
 */
export const problems: Problem[] = [
  {
    id: "p001",
    title: "全件取得する（SELECT *）",
    category: "SELECT",
    difficulty: 1,
    description:
      "`employees` テーブルからすべての列・すべての行を取得してください。",
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    seedSql: `
      INSERT INTO employees (id, name, department, salary) VALUES
        (1, '佐藤', '営業', 320000),
        (2, '鈴木', '開発', 450000),
        (3, '高橋', '開発', 410000),
        (4, '田中', '人事', 300000);
    `,
    expectedResult: {
      columns: ["id", "name", "department", "salary"],
      rows: [
        [1, "佐藤", "営業", 320000],
        [2, "鈴木", "開発", 450000],
        [3, "高橋", "開発", 410000],
        [4, "田中", "人事", 300000],
      ],
    },
    hints: [
      "SELECT の後に * を書くと全列を取得できます。",
      "FROM の後に対象のテーブル名 employees を書きます。",
      "解答例: SELECT * FROM employees;",
    ],
    explanation:
      "`SELECT * FROM テーブル名;` はテーブルの全列・全行を取得する最も基本的な構文です。列を絞りたい場合は `*` の代わりに列名をカンマ区切りで指定します。",
    sampleAnswer: "SELECT * FROM employees;",
  },
  {
    id: "p002",
    title: "列を指定して取得する",
    category: "SELECT",
    difficulty: 1,
    description:
      "`employees` テーブルから `name` と `salary` の2列だけを取得してください。",
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    seedSql: `
      INSERT INTO employees (id, name, department, salary) VALUES
        (1, '佐藤', '営業', 320000),
        (2, '鈴木', '開発', 450000),
        (3, '高橋', '開発', 410000);
    `,
    expectedResult: {
      columns: ["name", "salary"],
      rows: [
        ["佐藤", 320000],
        ["鈴木", 450000],
        ["高橋", 410000],
      ],
    },
    hints: [
      "SELECT の後に取得したい列名をカンマ区切りで書きます。",
      "解答例: SELECT name, salary FROM ...;",
    ],
    explanation:
      "必要な列だけを指定することで、転送量やクエリの意図を明確にできます。実務でも `SELECT *` は避け、必要な列を明示するのが推奨されます。",
    sampleAnswer: "SELECT name, salary FROM employees;",
  },
  {
    id: "p003",
    title: "条件で絞り込む（WHERE）",
    category: "WHERE",
    difficulty: 1,
    description:
      "`employees` テーブルから `department` が '開発' の従業員をすべて取得してください。",
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    seedSql: `
      INSERT INTO employees (id, name, department, salary) VALUES
        (1, '佐藤', '営業', 320000),
        (2, '鈴木', '開発', 450000),
        (3, '高橋', '開発', 410000),
        (4, '田中', '人事', 300000);
    `,
    expectedResult: {
      columns: ["id", "name", "department", "salary"],
      rows: [
        [2, "鈴木", "開発", 450000],
        [3, "高橋", "開発", 410000],
      ],
    },
    hints: [
      "WHERE句で条件を指定します。",
      "文字列は '開発' のようにシングルクォートで囲みます。",
      "解答例: SELECT * FROM employees WHERE department = '開発';",
    ],
    explanation:
      "`WHERE` 句は取得する行を条件で絞り込みます。文字列は必ずシングルクォート `'...'` で囲む点に注意してください。",
    sampleAnswer: "SELECT * FROM employees WHERE department = '開発';",
  },
  {
    id: "p004",
    title: "数値条件と並び替え（ORDER BY）",
    category: "ORDER BY",
    difficulty: 2,
    description:
      "`employees` テーブルから給与(`salary`)が350000以上の従業員を、給与の高い順に取得してください。",
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    seedSql: `
      INSERT INTO employees (id, name, department, salary) VALUES
        (1, '佐藤', '営業', 320000),
        (2, '鈴木', '開発', 450000),
        (3, '高橋', '開発', 410000),
        (4, '田中', '人事', 300000);
    `,
    expectedResult: {
      columns: ["id", "name", "department", "salary"],
      rows: [
        [2, "鈴木", "開発", 450000],
        [3, "高橋", "開発", 410000],
      ],
    },
    hints: [
      "WHERE句に比較演算子 >= を使います。",
      "並び替えには ORDER BY 列名 DESC を使います。",
      "解答例: SELECT * FROM employees WHERE salary >= 350000 ORDER BY salary DESC;",
    ],
    explanation:
      "`ORDER BY 列名 DESC` で降順、`ASC`（省略時のデフォルト）で昇順に並び替えられます。期待結果の行順序が意味を持つ問題では、必ず `ORDER BY` を使いましょう。",
    sampleAnswer:
      "SELECT * FROM employees WHERE salary >= 350000 ORDER BY salary DESC;",
  },
  {
    id: "p005",
    title: "件数を数える（COUNT）",
    category: "集計関数",
    difficulty: 2,
    description: "`employees` テーブルの従業員数を取得してください。列名は `count` としてください。",
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    seedSql: `
      INSERT INTO employees (id, name, department, salary) VALUES
        (1, '佐藤', '営業', 320000),
        (2, '鈴木', '開発', 450000),
        (3, '高橋', '開発', 410000),
        (4, '田中', '人事', 300000);
    `,
    expectedResult: {
      columns: ["count"],
      rows: [[4]],
    },
    hints: [
      "COUNT(*) で全行数を取得できます。",
      "AS で列名に別名（エイリアス）を付けられます。",
      "解答例: SELECT COUNT(*) AS count FROM employees;",
    ],
    explanation:
      "`COUNT(*)` は行数を数える集計関数です。`AS` で結果列に分かりやすい別名を付けられます。",
    sampleAnswer: "SELECT COUNT(*) AS count FROM employees;",
  },
  {
    id: "p006",
    title: "グループごとに集計する（GROUP BY）",
    category: "GROUP BY",
    difficulty: 3,
    description:
      "`employees` テーブルから部署(`department`)ごとの平均給与を求め、`department` と `avg_salary` の列で取得してください。",
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    seedSql: `
      INSERT INTO employees (id, name, department, salary) VALUES
        (1, '佐藤', '営業', 300000),
        (2, '鈴木', '開発', 450000),
        (3, '高橋', '開発', 410000),
        (4, '田中', '人事', 300000),
        (5, '伊藤', '営業', 340000);
    `,
    expectedResult: {
      columns: ["department", "avg_salary"],
      rows: [
        ["人事", 300000],
        ["営業", 320000],
        ["開発", 430000],
      ],
    },
    hints: [
      "GROUP BY department で部署ごとにグループ化します。",
      "AVG(salary) で平均を計算できます。",
      "結果の行順序を揃えるため ORDER BY department も付けましょう。",
      "解答例: SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department ORDER BY department;",
    ],
    explanation:
      "`GROUP BY` は指定した列の値ごとに行をグループ化し、`COUNT` `SUM` `AVG` などの集計関数と組み合わせて使います。",
    sampleAnswer:
      "SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department ORDER BY department;",
  },
  {
    id: "p007",
    title: "テーブルを結合する（INNER JOIN）",
    category: "JOIN",
    difficulty: 3,
    description:
      "`orders` テーブルと `customers` テーブルを結合し、注文ID(`order_id`)・顧客名(`customer_name`)・金額(`amount`)を取得してください。",
    schemaSql: `
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );
    `,
    seedSql: `
      INSERT INTO customers (id, name) VALUES (1, '山田商事'), (2, '田中物産');
      INSERT INTO orders (id, customer_id, amount) VALUES
        (101, 1, 5000),
        (102, 2, 8000),
        (103, 1, 3000);
    `,
    expectedResult: {
      columns: ["order_id", "customer_name", "amount"],
      rows: [
        [101, "山田商事", 5000],
        [102, "田中物産", 8000],
        [103, "山田商事", 3000],
      ],
    },
    hints: [
      "INNER JOIN ... ON で2つのテーブルを結合します。",
      "結合条件は orders.customer_id = customers.id です。",
      "解答例: SELECT orders.id AS order_id, customers.name AS customer_name, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id ORDER BY orders.id;",
    ],
    explanation:
      "`INNER JOIN` は2つのテーブルを共通のキーで結合し、両方に存在する行だけを取得します。列名が重複する場合は `テーブル名.列名` で明示します。",
    sampleAnswer:
      "SELECT orders.id AS order_id, customers.name AS customer_name, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id ORDER BY orders.id;",
  },
  {
    id: "p008",
    title: "外部結合で欠損を含めて取得する（LEFT JOIN）",
    category: "JOIN",
    difficulty: 4,
    description:
      "すべての顧客について、注文が無い顧客も含めて `customer_name` と 注文合計金額 `total_amount`（注文が無ければ0）を取得してください。",
    schemaSql: `
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        amount INTEGER NOT NULL
      );
    `,
    seedSql: `
      INSERT INTO customers (id, name) VALUES (1, '山田商事'), (2, '田中物産'), (3, '鈴木産業');
      INSERT INTO orders (id, customer_id, amount) VALUES
        (101, 1, 5000),
        (102, 1, 2000),
        (103, 2, 8000);
    `,
    expectedResult: {
      columns: ["customer_name", "total_amount"],
      rows: [
        ["山田商事", 7000],
        ["田中物産", 8000],
        ["鈴木産業", 0],
      ],
    },
    hints: [
      "LEFT JOIN を使うと右側のテーブルに一致が無くても左側の行は残ります。",
      "COALESCE(SUM(amount), 0) で NULL を 0 に変換できます。",
      "GROUP BY customers.id, customers.name を忘れずに。",
      "解答例: SELECT customers.name AS customer_name, COALESCE(SUM(orders.amount), 0) AS total_amount FROM customers LEFT JOIN orders ON customers.id = orders.customer_id GROUP BY customers.id, customers.name ORDER BY customers.id;",
    ],
    explanation:
      "`LEFT JOIN` は左テーブルの全行を残し、右テーブルに対応が無い場合は NULL になります。集計時は `COALESCE` で NULL を扱いやすい値に変換すると便利です。",
    sampleAnswer:
      "SELECT customers.name AS customer_name, COALESCE(SUM(orders.amount), 0) AS total_amount FROM customers LEFT JOIN orders ON customers.id = orders.customer_id GROUP BY customers.id, customers.name ORDER BY customers.id;",
  },
  {
    id: "p009",
    title: "データを追加する（INSERT）",
    category: "INSERT",
    difficulty: 2,
    description:
      "`employees` テーブルに、id=5, name='中村', department='開発', salary=380000 の従業員を1件追加し、その後 employees の全件を id 順で取得してください。",
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    seedSql: `
      INSERT INTO employees (id, name, department, salary) VALUES
        (1, '佐藤', '営業', 320000),
        (2, '鈴木', '開発', 450000);
    `,
    expectedResult: {
      columns: ["id", "name", "department", "salary"],
      rows: [
        [1, "佐藤", "営業", 320000],
        [2, "鈴木", "開発", 450000],
        [5, "中村", "開発", 380000],
      ],
    },
    hints: [
      "INSERT INTO テーブル名 (列...) VALUES (値...); でデータを追加します。",
      "複数のSQL文はセミコロンで区切って両方実行できます。",
      "解答例: INSERT INTO employees (id, name, department, salary) VALUES (5, '中村', '開発', 380000); SELECT * FROM employees ORDER BY id;",
    ],
    explanation:
      "このエディタは複数文を続けて実行できます（最後の SELECT の結果が表示されます）。実務では INSERT 後に確認の SELECT を行うのが一般的です。",
    sampleAnswer:
      "INSERT INTO employees (id, name, department, salary) VALUES (5, '中村', '開発', 380000);\nSELECT * FROM employees ORDER BY id;",
  },
  {
    id: "p010",
    title: "データを更新する（UPDATE）",
    category: "UPDATE",
    difficulty: 2,
    description:
      "`employees` テーブルの `department` が '開発' の従業員全員の給与を10%アップ（1.1倍）してください。その後、employees の全件を id 順で取得してください。",
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    seedSql: `
      INSERT INTO employees (id, name, department, salary) VALUES
        (1, '佐藤', '営業', 300000),
        (2, '鈴木', '開発', 400000),
        (3, '高橋', '開発', 400000);
    `,
    expectedResult: {
      columns: ["id", "name", "department", "salary"],
      rows: [
        [1, "佐藤", "営業", 300000],
        [2, "鈴木", "開発", 440000],
        [3, "高橋", "開発", 440000],
      ],
    },
    hints: [
      "UPDATE テーブル名 SET 列 = 式 WHERE 条件; の形で書きます。",
      "salary * 1.1 のように計算式を SET に書けます。",
      "解答例: UPDATE employees SET salary = salary * 1.1 WHERE department = '開発'; SELECT * FROM employees ORDER BY id;",
    ],
    explanation:
      "`UPDATE` は `WHERE` を付け忘れると全行が更新されてしまうため注意が必要です。実務では実行前に同じ条件で `SELECT` して対象行を確認する習慣が推奨されます。",
    sampleAnswer:
      "UPDATE employees SET salary = salary * 1.1 WHERE department = '開発';\nSELECT * FROM employees ORDER BY id;",
  },
];

export function getProblemById(id: string): Problem | undefined {
  return problems.find((p) => p.id === id);
}
