export interface CppSnippet {
  label: string;
  detail: string;
  documentation: string;
  insertText: string;
  category: 'STL' | 'Template' | 'Algorithm' | 'Data Structure' | 'Utility';
}

export const CPP_DSA_SNIPPETS: CppSnippet[] = [
  {
    label: 'fastio',
    detail: 'Fast I/O for Competitive Programming / DSA',
    documentation: 'Speeds up cin/cout by desyncing with stdio and untying cin from cout.',
    category: 'Utility',
    insertText: `ios_base::sync_with_stdio(false);\ncin.tie(NULL);\ncout.tie(NULL);`,
  },
  {
    label: 'template_cp',
    detail: 'Complete C++ DSA Boilerplate with includes and fast I/O',
    documentation: 'Complete competitive programming header with common macros and types.',
    category: 'Template',
    insertText: `#include <bits/stdc++.h>
using namespace std;

#define ll long long
#define pii pair<int, int>
#define vi vector<int>
#define vll vector<long long>
#define pb push_back
#define all(x) (x).begin(), (x).end()
#define sz(x) (int)(x).size()

void solve() {
    // Your DSA logic here
    \${1}
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t = 1;
    // cin >> t; // uncomment for multi-testcases
    while (t--) {
        solve();
    }
    return 0;
}`,
  },
  {
    label: 'binsearch',
    detail: 'Binary Search Template',
    documentation: 'Standard binary search for monotonic condition.',
    category: 'Algorithm',
    insertText: `int low = 0, high = \${1:n - 1};
int ans = -1;
while (low <= high) {
    int mid = low + (high - low) / 2;
    if (\${2:condition(mid)}) {
        ans = mid;
        high = mid - 1; // or low = mid + 1 depending on search
    } else {
        low = mid + 1;
    }
}`,
  },
  {
    label: 'bfs_grid',
    detail: 'BFS on 2D Grid / Matrix',
    documentation: 'Breadth-First Search on a matrix with 4 directions.',
    category: 'Algorithm',
    insertText: `int rows = \${1:grid}.size(), cols = \${1:grid}[0].size();
vector<vector<bool>> visited(rows, vector<bool>(cols, false));
queue<pair<int, int>> q;

int dx[] = {-1, 1, 0, 0};
int dy[] = {0, 0, -1, 1};

q.push({\${2:startRow}, \${3:startCol}});
visited[\${2:startRow}][\${3:startCol}] = true;

while (!q.empty()) {
    auto [r, c] = q.front();
    q.pop();

    for (int i = 0; i < 4; ++i) {
        int nr = r + dx[i];
        int nc = c + dy[i];

        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
            visited[nr][nc] = true;
            q.push({nr, nc});
        }
    }
}`,
  },
  {
    label: 'dsu',
    detail: 'Disjoint Set Union (Union-Find) with Rank & Path Compression',
    documentation: 'DSU data structure with O(alpha(N)) nearly constant amortized time.',
    category: 'Data Structure',
    insertText: `class DSU {
public:
    vector<int> parent, rank, size;
    DSU(int n) {
        parent.resize(n + 1);
        rank.resize(n + 1, 0);
        size.resize(n + 1, 1);
        for (int i = 0; i <= n; i++) parent[i] = i;
    }

    int find(int i) {
        if (parent[i] == i)
            return i;
        return parent[i] = find(parent[i]); // Path compression
    }

    bool unite(int i, int j) {
        int root_i = find(i);
        int root_j = find(j);
        if (root_i == root_j) return false;

        // Union by rank
        if (rank[root_i] < rank[root_j]) {
            parent[root_i] = root_j;
            size[root_j] += size[root_i];
        } else if (rank[root_i] > rank[root_j]) {
            parent[root_j] = root_i;
            size[root_i] += size[root_j];
        } else {
            parent[root_j] = root_i;
            size[root_i] += size[root_j];
            rank[root_i]++;
        }
        return true;
    }
};`,
  },
  {
    label: 'segtree',
    detail: 'Segment Tree (Point Update, Range Query)',
    documentation: 'Segment tree with O(log N) updates and O(log N) sum/min queries.',
    category: 'Data Structure',
    insertText: `class SegmentTree {
private:
    int n;
    vector<int> tree;

    void build(const vector<int>& arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
            return;
        }
        int mid = start + (end - start) / 2;
        build(arr, 2 * node, start, mid);
        build(arr, 2 * node + 1, mid + 1, end);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
            return;
        }
        int mid = start + (end - start) / 2;
        if (idx <= mid) update(2 * node, start, mid, idx, val);
        else update(2 * node + 1, mid + 1, end, idx, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    int query(int node, int start, int end, int l, int r) {
        if (r < start || end < l) return 0;
        if (l <= start && end <= r) return tree[node];
        int mid = start + (end - start) / 2;
        return query(2 * node, start, mid, l, r) + query(2 * node + 1, mid + 1, end, l, r);
    }

public:
    SegmentTree(const vector<int>& arr) {
        n = arr.size();
        tree.resize(4 * n, 0);
        if (n > 0) build(arr, 1, 0, n - 1);
    }

    void update(int idx, int val) { update(1, 0, n - 1, idx, val); }
    int query(int l, int r) { return query(1, 0, n - 1, l, r); }
};`,
  },
  {
    label: 'dijkstra',
    detail: 'Dijkstra Single Source Shortest Path',
    documentation: 'Dijkstra shortest path algorithm using priority_queue in O((V + E) log V).',
    category: 'Algorithm',
    insertText: `vector<long long> dijkstra(int n, int src, const vector<vector<pair<int, int>>>& adj) {
    const long long INF = 1e18;
    vector<long long> dist(n, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;

    dist[src] = 0;
    pq.push({0, src});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue;

        for (auto& edge : adj[u]) {
            int v = edge.first;
            int weight = edge.second;

            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`,
  },
  {
    label: 'trie',
    detail: 'Trie (Prefix Tree) Implementation',
    documentation: 'Efficient string search & prefix matching structure.',
    category: 'Data Structure',
    insertText: `class TrieNode {
public:
    TrieNode* children[26];
    bool isEndOfWord;
    TrieNode() {
        isEndOfWord = false;
        for (int i = 0; i < 26; i++) children[i] = nullptr;
    }
};

class Trie {
private:
    TrieNode* root;
public:
    Trie() { root = new TrieNode(); }

    void insert(string word) {
        TrieNode* node = root;
        for (char c : word) {
            int idx = c - 'a';
            if (!node->children[idx]) node->children[idx] = new TrieNode();
            node = node->children[idx];
        }
        node->isEndOfWord = true;
    }

    bool search(string word) {
        TrieNode* node = root;
        for (char c : word) {
            int idx = c - 'a';
            if (!node->children[idx]) return false;
            node = node->children[idx];
        }
        return node && node->isEndOfWord;
    }

    bool startsWith(string prefix) {
        TrieNode* node = root;
        for (char c : prefix) {
            int idx = c - 'a';
            if (!node->children[idx]) return false;
            node = node->children[idx];
        }
        return node != nullptr;
    }
};`,
  },
  {
    label: 'monotonic_stack',
    detail: 'Monotonic Stack (Next Greater Element)',
    documentation: 'Template to find next greater or smaller element in O(N) linear time.',
    category: 'Algorithm',
    insertText: `vector<int> nextGreaterElements(const vector<int>& nums) {
    int n = nums.size();
    vector<int> result(n, -1);
    stack<int> st; // stores indices

    for (int i = 0; i < n; i++) {
        while (!st.empty() && nums[i] > nums[st.top()]) {
            result[st.top()] = nums[i];
            st.pop();
        }
        st.push(i);
    }
    return result;
}`,
  },
  {
    label: 'sliding_window',
    detail: 'Variable-size Sliding Window Template',
    documentation: 'Two-pointer sliding window pattern for subarrays and substrings.',
    category: 'Algorithm',
    insertText: `int left = 0, ans = 0;
unordered_map<char, int> freq;

for (int right = 0; right < \${1:s}.size(); right++) {
    freq[\${1:s}[right]]++;

    while (\${2:/* condition invalidated */}) {
        freq[\${1:s}[left]]--;
        if (freq[\${1:s}[left]] == 0) freq.erase(\${1:s}[left]);
        left++;
    }

    ans = max(ans, right - left + 1);
}`,
  },
  {
    label: 'fenwick_tree',
    detail: 'Fenwick Tree (Binary Indexed Tree / BIT)',
    documentation: '1D Fenwick Tree for point updates and prefix sums in O(log N).',
    category: 'Data Structure',
    insertText: `class FenwickTree {
private:
    int n;
    vector<int> bit;
public:
    FenwickTree(int n) : n(n), bit(n + 1, 0) {}

    void add(int idx, int delta) {
        for (; idx <= n; idx += idx & -idx)
            bit[idx] += delta;
    }

    int query(int idx) {
        int sum = 0;
        for (; idx > 0; idx -= idx & -idx)
            sum += bit[idx];
        return sum;
    }

    int rangeQuery(int l, int r) {
        return query(r) - query(l - 1);
    }
};`,
  },
];
