import type { Problem } from "../types/problem";

/**
 * MVP problem set, managed in-repo per 要件9.2 (Git-based content management).
 * Each problem's schema/seed run in an isolated in-browser SQLite instance.
 *
 * `content` holds everything that differs by locale, including seed data and
 * expected results — the seed data uses locale-appropriate values (e.g.
 * department names) that the description and sample answer refer to by
 * literal string, so they must stay in sync per locale (要件9.5).
 * `schemaSql` (table/column structure) and `difficulty` are locale-independent.
 */
export const problems: Problem[] = [
  {
    id: "p001",
    difficulty: 1,
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    content: {
      ja: {
        title: "全件取得する（SELECT *）",
        category: "SELECT",
        description:
          "`employees` テーブルからすべての列・すべての行を取得してください。",
        hints: [
          "SELECT の後に * を書くと全列を取得できます。",
          "FROM の後に対象のテーブル名 employees を書きます。",
          "解答例: SELECT * FROM employees;",
        ],
        explanation:
          "`SELECT * FROM テーブル名;` はテーブルの全列・全行を取得する最も基本的な構文です。列を絞りたい場合は `*` の代わりに列名をカンマ区切りで指定します。",
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
        sampleAnswer: "SELECT * FROM employees;",
      },
      en: {
        title: "Select all rows (SELECT *)",
        category: "SELECT",
        description:
          "Retrieve every column and every row from the `employees` table.",
        hints: [
          "Write `*` right after SELECT to get every column.",
          "Write the target table name, `employees`, after FROM.",
          "Example answer: SELECT * FROM employees;",
        ],
        explanation:
          "`SELECT * FROM table_name;` is the most basic way to fetch every column and row of a table. To limit which columns come back, list column names separated by commas instead of `*`.",
        seedSql: `
          INSERT INTO employees (id, name, department, salary) VALUES
            (1, 'Smith', 'Sales', 320000),
            (2, 'Johnson', 'Engineering', 450000),
            (3, 'Williams', 'Engineering', 410000),
            (4, 'Brown', 'HR', 300000);
        `,
        expectedResult: {
          columns: ["id", "name", "department", "salary"],
          rows: [
            [1, "Smith", "Sales", 320000],
            [2, "Johnson", "Engineering", 450000],
            [3, "Williams", "Engineering", 410000],
            [4, "Brown", "HR", 300000],
          ],
        },
        sampleAnswer: "SELECT * FROM employees;",
      },
    },
  },
  {
    id: "p002",
    difficulty: 1,
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    content: {
      ja: {
        title: "列を指定して取得する",
        category: "SELECT",
        description:
          "`employees` テーブルから `name` と `salary` の2列だけを取得してください。",
        hints: [
          "SELECT の後に取得したい列名をカンマ区切りで書きます。",
          "解答例: SELECT name, salary FROM ...;",
        ],
        explanation:
          "必要な列だけを指定することで、転送量やクエリの意図を明確にできます。実務でも `SELECT *` は避け、必要な列を明示するのが推奨されます。",
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
        sampleAnswer: "SELECT name, salary FROM employees;",
      },
      en: {
        title: "Select specific columns",
        category: "SELECT",
        description:
          "Retrieve only the `name` and `salary` columns from the `employees` table.",
        hints: [
          "List the column names you want, separated by commas, after SELECT.",
          "Example answer: SELECT name, salary FROM ...;",
        ],
        explanation:
          "Naming only the columns you need makes the query's intent clearer and avoids fetching data you won't use. In practice, avoiding `SELECT *` in favor of explicit columns is generally recommended.",
        seedSql: `
          INSERT INTO employees (id, name, department, salary) VALUES
            (1, 'Smith', 'Sales', 320000),
            (2, 'Johnson', 'Engineering', 450000),
            (3, 'Williams', 'Engineering', 410000);
        `,
        expectedResult: {
          columns: ["name", "salary"],
          rows: [
            ["Smith", 320000],
            ["Johnson", 450000],
            ["Williams", 410000],
          ],
        },
        sampleAnswer: "SELECT name, salary FROM employees;",
      },
    },
  },
  {
    id: "p003",
    difficulty: 1,
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    content: {
      ja: {
        title: "条件で絞り込む（WHERE）",
        category: "WHERE",
        description:
          "`employees` テーブルから `department` が '開発' の従業員をすべて取得してください。",
        hints: [
          "WHERE句で条件を指定します。",
          "文字列は '開発' のようにシングルクォートで囲みます。",
          "解答例: SELECT * FROM employees WHERE department = '開発';",
        ],
        explanation:
          "`WHERE` 句は取得する行を条件で絞り込みます。文字列は必ずシングルクォート `'...'` で囲む点に注意してください。",
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
        sampleAnswer: "SELECT * FROM employees WHERE department = '開発';",
      },
      en: {
        title: "Filter with a condition (WHERE)",
        category: "WHERE",
        description:
          "Retrieve every employee from the `employees` table whose `department` is 'Engineering'.",
        hints: [
          "Use a WHERE clause to specify a condition.",
          "Wrap string literals in single quotes, like 'Engineering'.",
          "Example answer: SELECT * FROM employees WHERE department = 'Engineering';",
        ],
        explanation:
          "The `WHERE` clause filters which rows are returned based on a condition. Remember that string literals must always be wrapped in single quotes `'...'`.",
        seedSql: `
          INSERT INTO employees (id, name, department, salary) VALUES
            (1, 'Smith', 'Sales', 320000),
            (2, 'Johnson', 'Engineering', 450000),
            (3, 'Williams', 'Engineering', 410000),
            (4, 'Brown', 'HR', 300000);
        `,
        expectedResult: {
          columns: ["id", "name", "department", "salary"],
          rows: [
            [2, "Johnson", "Engineering", 450000],
            [3, "Williams", "Engineering", 410000],
          ],
        },
        sampleAnswer: "SELECT * FROM employees WHERE department = 'Engineering';",
      },
    },
  },
  {
    id: "p004",
    difficulty: 2,
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    content: {
      ja: {
        title: "数値条件と並び替え（ORDER BY）",
        category: "ORDER BY",
        description:
          "`employees` テーブルから給与(`salary`)が350000以上の従業員を、給与の高い順に取得してください。",
        hints: [
          "WHERE句に比較演算子 >= を使います。",
          "並び替えには ORDER BY 列名 DESC を使います。",
          "解答例: SELECT * FROM employees WHERE salary >= 350000 ORDER BY salary DESC;",
        ],
        explanation:
          "`ORDER BY 列名 DESC` で降順、`ASC`（省略時のデフォルト）で昇順に並び替えられます。期待結果の行順序が意味を持つ問題では、必ず `ORDER BY` を使いましょう。",
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
        sampleAnswer:
          "SELECT * FROM employees WHERE salary >= 350000 ORDER BY salary DESC;",
      },
      en: {
        title: "Numeric conditions and sorting (ORDER BY)",
        category: "ORDER BY",
        description:
          "Retrieve employees from the `employees` table whose `salary` is 350000 or more, ordered from highest to lowest salary.",
        hints: [
          "Use the >= comparison operator in the WHERE clause.",
          "Use ORDER BY column_name DESC to sort.",
          "Example answer: SELECT * FROM employees WHERE salary >= 350000 ORDER BY salary DESC;",
        ],
        explanation:
          "`ORDER BY column_name DESC` sorts in descending order; `ASC` (the default when omitted) sorts ascending. Whenever a problem's expected result depends on row order, be sure to add `ORDER BY`.",
        seedSql: `
          INSERT INTO employees (id, name, department, salary) VALUES
            (1, 'Smith', 'Sales', 320000),
            (2, 'Johnson', 'Engineering', 450000),
            (3, 'Williams', 'Engineering', 410000),
            (4, 'Brown', 'HR', 300000);
        `,
        expectedResult: {
          columns: ["id", "name", "department", "salary"],
          rows: [
            [2, "Johnson", "Engineering", 450000],
            [3, "Williams", "Engineering", 410000],
          ],
        },
        sampleAnswer:
          "SELECT * FROM employees WHERE salary >= 350000 ORDER BY salary DESC;",
      },
    },
  },
  {
    id: "p005",
    difficulty: 2,
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    content: {
      ja: {
        title: "件数を数える（COUNT）",
        category: "集計関数",
        description:
          "`employees` テーブルの従業員数を取得してください。列名は `count` としてください。",
        hints: [
          "COUNT(*) で全行数を取得できます。",
          "AS で列名に別名（エイリアス）を付けられます。",
          "解答例: SELECT COUNT(*) AS count FROM employees;",
        ],
        explanation:
          "`COUNT(*)` は行数を数える集計関数です。`AS` で結果列に分かりやすい別名を付けられます。",
        seedSql: `
          INSERT INTO employees (id, name, department, salary) VALUES
            (1, '佐藤', '営業', 320000),
            (2, '鈴木', '開発', 450000),
            (3, '高橋', '開発', 410000),
            (4, '田中', '人事', 300000);
        `,
        expectedResult: { columns: ["count"], rows: [[4]] },
        sampleAnswer: "SELECT COUNT(*) AS count FROM employees;",
      },
      en: {
        title: "Count rows (COUNT)",
        category: "Aggregate Functions",
        description:
          "Retrieve the number of employees in the `employees` table. Name the result column `count`.",
        hints: [
          "COUNT(*) returns the total number of rows.",
          "AS lets you give the result column an alias.",
          "Example answer: SELECT COUNT(*) AS count FROM employees;",
        ],
        explanation:
          "`COUNT(*)` is an aggregate function that counts rows. Use `AS` to give the result column a clear, readable alias.",
        seedSql: `
          INSERT INTO employees (id, name, department, salary) VALUES
            (1, 'Smith', 'Sales', 320000),
            (2, 'Johnson', 'Engineering', 450000),
            (3, 'Williams', 'Engineering', 410000),
            (4, 'Brown', 'HR', 300000);
        `,
        expectedResult: { columns: ["count"], rows: [[4]] },
        sampleAnswer: "SELECT COUNT(*) AS count FROM employees;",
      },
    },
  },
  {
    id: "p006",
    difficulty: 3,
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    content: {
      ja: {
        title: "グループごとに集計する（GROUP BY）",
        category: "GROUP BY",
        description:
          "`employees` テーブルから部署(`department`)ごとの平均給与を求め、`department` と `avg_salary` の列で取得してください。",
        hints: [
          "GROUP BY department で部署ごとにグループ化します。",
          "AVG(salary) で平均を計算できます。",
          "結果の行順序を揃えるため ORDER BY department も付けましょう。",
          "解答例: SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department ORDER BY department;",
        ],
        explanation:
          "`GROUP BY` は指定した列の値ごとに行をグループ化し、`COUNT` `SUM` `AVG` などの集計関数と組み合わせて使います。",
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
        sampleAnswer:
          "SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department ORDER BY department;",
      },
      en: {
        title: "Aggregate per group (GROUP BY)",
        category: "GROUP BY",
        description:
          "Find the average salary per department (`department`) in the `employees` table, returning `department` and `avg_salary` columns.",
        hints: [
          "GROUP BY department groups rows by department.",
          "AVG(salary) computes the average.",
          "Add ORDER BY department too, so the row order is predictable.",
          "Example answer: SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department ORDER BY department;",
        ],
        explanation:
          "`GROUP BY` groups rows by the value of a given column, and is typically combined with aggregate functions like `COUNT`, `SUM`, or `AVG`.",
        seedSql: `
          INSERT INTO employees (id, name, department, salary) VALUES
            (1, 'Smith', 'Sales', 300000),
            (2, 'Johnson', 'Engineering', 450000),
            (3, 'Williams', 'Engineering', 410000),
            (4, 'Brown', 'HR', 300000),
            (5, 'Davis', 'Sales', 340000);
        `,
        expectedResult: {
          columns: ["department", "avg_salary"],
          rows: [
            ["Engineering", 430000],
            ["HR", 300000],
            ["Sales", 320000],
          ],
        },
        sampleAnswer:
          "SELECT department, AVG(salary) AS avg_salary FROM employees GROUP BY department ORDER BY department;",
      },
    },
  },
  {
    id: "p007",
    difficulty: 3,
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
    content: {
      ja: {
        title: "テーブルを結合する（INNER JOIN）",
        category: "JOIN",
        description:
          "`orders` テーブルと `customers` テーブルを結合し、注文ID(`order_id`)・顧客名(`customer_name`)・金額(`amount`)を取得してください。",
        hints: [
          "INNER JOIN ... ON で2つのテーブルを結合します。",
          "結合条件は orders.customer_id = customers.id です。",
          "解答例: SELECT orders.id AS order_id, customers.name AS customer_name, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id ORDER BY orders.id;",
        ],
        explanation:
          "`INNER JOIN` は2つのテーブルを共通のキーで結合し、両方に存在する行だけを取得します。列名が重複する場合は `テーブル名.列名` で明示します。",
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
        sampleAnswer:
          "SELECT orders.id AS order_id, customers.name AS customer_name, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id ORDER BY orders.id;",
      },
      en: {
        title: "Join two tables (INNER JOIN)",
        category: "JOIN",
        description:
          "Join the `orders` and `customers` tables to retrieve order ID (`order_id`), customer name (`customer_name`), and amount (`amount`).",
        hints: [
          "Use INNER JOIN ... ON to join two tables.",
          "The join condition is orders.customer_id = customers.id.",
          "Example answer: SELECT orders.id AS order_id, customers.name AS customer_name, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id ORDER BY orders.id;",
        ],
        explanation:
          "`INNER JOIN` combines two tables on a shared key, returning only rows that have a match in both. When column names collide, qualify them as `table_name.column_name`.",
        seedSql: `
          INSERT INTO customers (id, name) VALUES (1, 'Acme Corp'), (2, 'Globex Inc');
          INSERT INTO orders (id, customer_id, amount) VALUES
            (101, 1, 5000),
            (102, 2, 8000),
            (103, 1, 3000);
        `,
        expectedResult: {
          columns: ["order_id", "customer_name", "amount"],
          rows: [
            [101, "Acme Corp", 5000],
            [102, "Globex Inc", 8000],
            [103, "Acme Corp", 3000],
          ],
        },
        sampleAnswer:
          "SELECT orders.id AS order_id, customers.name AS customer_name, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id ORDER BY orders.id;",
      },
    },
  },
  {
    id: "p008",
    difficulty: 4,
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
    content: {
      ja: {
        title: "外部結合で欠損を含めて取得する（LEFT JOIN）",
        category: "JOIN",
        description:
          "すべての顧客について、注文が無い顧客も含めて `customer_name` と 注文合計金額 `total_amount`（注文が無ければ0）を取得してください。",
        hints: [
          "LEFT JOIN を使うと右側のテーブルに一致が無くても左側の行は残ります。",
          "COALESCE(SUM(amount), 0) で NULL を 0 に変換できます。",
          "GROUP BY customers.id, customers.name を忘れずに。",
          "解答例: SELECT customers.name AS customer_name, COALESCE(SUM(orders.amount), 0) AS total_amount FROM customers LEFT JOIN orders ON customers.id = orders.customer_id GROUP BY customers.id, customers.name ORDER BY customers.id;",
        ],
        explanation:
          "`LEFT JOIN` は左テーブルの全行を残し、右テーブルに対応が無い場合は NULL になります。集計時は `COALESCE` で NULL を扱いやすい値に変換すると便利です。",
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
        sampleAnswer:
          "SELECT customers.name AS customer_name, COALESCE(SUM(orders.amount), 0) AS total_amount FROM customers LEFT JOIN orders ON customers.id = orders.customer_id GROUP BY customers.id, customers.name ORDER BY customers.id;",
      },
      en: {
        title: "Include unmatched rows with an outer join (LEFT JOIN)",
        category: "JOIN",
        description:
          "For every customer — including those with no orders — retrieve `customer_name` and the total order amount `total_amount` (0 if they have no orders).",
        hints: [
          "LEFT JOIN keeps every row from the left table even without a match on the right.",
          "COALESCE(SUM(amount), 0) turns NULL into 0.",
          "Don't forget GROUP BY customers.id, customers.name.",
          "Example answer: SELECT customers.name AS customer_name, COALESCE(SUM(orders.amount), 0) AS total_amount FROM customers LEFT JOIN orders ON customers.id = orders.customer_id GROUP BY customers.id, customers.name ORDER BY customers.id;",
        ],
        explanation:
          "`LEFT JOIN` keeps every row from the left table, filling in NULL where the right table has no match. When aggregating, `COALESCE` is a handy way to turn those NULLs into a usable value.",
        seedSql: `
          INSERT INTO customers (id, name) VALUES (1, 'Acme Corp'), (2, 'Globex Inc'), (3, 'Initech');
          INSERT INTO orders (id, customer_id, amount) VALUES
            (101, 1, 5000),
            (102, 1, 2000),
            (103, 2, 8000);
        `,
        expectedResult: {
          columns: ["customer_name", "total_amount"],
          rows: [
            ["Acme Corp", 7000],
            ["Globex Inc", 8000],
            ["Initech", 0],
          ],
        },
        sampleAnswer:
          "SELECT customers.name AS customer_name, COALESCE(SUM(orders.amount), 0) AS total_amount FROM customers LEFT JOIN orders ON customers.id = orders.customer_id GROUP BY customers.id, customers.name ORDER BY customers.id;",
      },
    },
  },
  {
    id: "p009",
    difficulty: 2,
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    content: {
      ja: {
        title: "データを追加する（INSERT）",
        category: "INSERT",
        description:
          "`employees` テーブルに、id=5, name='中村', department='開発', salary=380000 の従業員を1件追加し、その後 employees の全件を id 順で取得してください。",
        hints: [
          "INSERT INTO テーブル名 (列...) VALUES (値...); でデータを追加します。",
          "複数のSQL文はセミコロンで区切って両方実行できます。",
          "解答例: INSERT INTO employees (id, name, department, salary) VALUES (5, '中村', '開発', 380000); SELECT * FROM employees ORDER BY id;",
        ],
        explanation:
          "このエディタは複数文を続けて実行できます（最後の SELECT の結果が表示されます）。実務では INSERT 後に確認の SELECT を行うのが一般的です。",
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
        sampleAnswer:
          "INSERT INTO employees (id, name, department, salary) VALUES (5, '中村', '開発', 380000);\nSELECT * FROM employees ORDER BY id;",
      },
      en: {
        title: "Add data (INSERT)",
        category: "INSERT",
        description:
          "Add one new employee to `employees` with id=5, name='Miller', department='Engineering', salary=380000, then retrieve every row in `employees` ordered by id.",
        hints: [
          "INSERT INTO table_name (columns...) VALUES (values...); adds a new row.",
          "You can run multiple SQL statements separated by semicolons.",
          "Example answer: INSERT INTO employees (id, name, department, salary) VALUES (5, 'Miller', 'Engineering', 380000); SELECT * FROM employees ORDER BY id;",
        ],
        explanation:
          "This editor can run multiple statements in sequence (the result of the last SELECT is shown). In practice, it's common to follow an INSERT with a SELECT to confirm the change.",
        seedSql: `
          INSERT INTO employees (id, name, department, salary) VALUES
            (1, 'Smith', 'Sales', 320000),
            (2, 'Johnson', 'Engineering', 450000);
        `,
        expectedResult: {
          columns: ["id", "name", "department", "salary"],
          rows: [
            [1, "Smith", "Sales", 320000],
            [2, "Johnson", "Engineering", 450000],
            [5, "Miller", "Engineering", 380000],
          ],
        },
        sampleAnswer:
          "INSERT INTO employees (id, name, department, salary) VALUES (5, 'Miller', 'Engineering', 380000);\nSELECT * FROM employees ORDER BY id;",
      },
    },
  },
  {
    id: "p010",
    difficulty: 2,
    schemaSql: `
      CREATE TABLE employees (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        department TEXT NOT NULL,
        salary INTEGER NOT NULL
      );
    `,
    content: {
      ja: {
        title: "データを更新する（UPDATE）",
        category: "UPDATE",
        description:
          "`employees` テーブルの `department` が '開発' の従業員全員の給与を10%アップ（1.1倍）してください。その後、employees の全件を id 順で取得してください。",
        hints: [
          "UPDATE テーブル名 SET 列 = 式 WHERE 条件; の形で書きます。",
          "salary * 1.1 のように計算式を SET に書けます。",
          "解答例: UPDATE employees SET salary = salary * 1.1 WHERE department = '開発'; SELECT * FROM employees ORDER BY id;",
        ],
        explanation:
          "`UPDATE` は `WHERE` を付け忘れると全行が更新されてしまうため注意が必要です。実務では実行前に同じ条件で `SELECT` して対象行を確認する習慣が推奨されます。",
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
        sampleAnswer:
          "UPDATE employees SET salary = salary * 1.1 WHERE department = '開発';\nSELECT * FROM employees ORDER BY id;",
      },
      en: {
        title: "Update data (UPDATE)",
        category: "UPDATE",
        description:
          "Give every employee in the 'Engineering' department a 10% raise (multiply salary by 1.1). Then retrieve every row in `employees` ordered by id.",
        hints: [
          "The form is UPDATE table_name SET column = expression WHERE condition;.",
          "You can write an expression like salary * 1.1 in SET.",
          "Example answer: UPDATE employees SET salary = salary * 1.1 WHERE department = 'Engineering'; SELECT * FROM employees ORDER BY id;",
        ],
        explanation:
          "Forgetting the `WHERE` clause on an `UPDATE` will update every row, so be careful. In practice, it's recommended to first run a `SELECT` with the same condition to confirm which rows will be affected.",
        seedSql: `
          INSERT INTO employees (id, name, department, salary) VALUES
            (1, 'Smith', 'Sales', 300000),
            (2, 'Johnson', 'Engineering', 400000),
            (3, 'Williams', 'Engineering', 400000);
        `,
        expectedResult: {
          columns: ["id", "name", "department", "salary"],
          rows: [
            [1, "Smith", "Sales", 300000],
            [2, "Johnson", "Engineering", 440000],
            [3, "Williams", "Engineering", 440000],
          ],
        },
        sampleAnswer:
          "UPDATE employees SET salary = salary * 1.1 WHERE department = 'Engineering';\nSELECT * FROM employees ORDER BY id;",
      },
    },
  },
];

export function getProblemById(id: string): Problem | undefined {
  return problems.find((p) => p.id === id);
}
