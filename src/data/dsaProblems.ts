import { DSAProblem } from '../types/dsa';

export const DSA_PROBLEMS: DSAProblem[] = [
  {
    id: 'custom-playground',
    title: 'Custom C++ Playground / Scratchpad',
    difficulty: 'Easy',
    topic: 'Custom Playground',
    description: `A blank C++20 sandbox with standard competitive programming headers, fast I/O, and custom standard input/output execution.

Write any DSA algorithm, test your logic, or solve problems from Codeforces, LeetCode, or HackerRank.`,
    examples: [
      {
        input: '5\n1 2 3 4 5',
        output: 'Sum = 15',
        explanation: 'Reads n integers from standard input and prints the sum.',
      },
    ],
    constraints: ['Standard C++20 STL support', 'cin / cout interactive execution supported'],
    starterCode: `#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>
#include <string>
#include <map>
#include <set>
#include <queue>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (cin >> n) {
        vector<int> arr(n);
        long long sum = 0;
        for (int i = 0; i < n; i++) {
            cin >> arr[i];
            sum += arr[i];
        }
        cout << "Sum = " << sum << "\\n";
    } else {
        cout << "Hello DSA C++ Enthusiast! Type input in the Stdin box below.\\n";
    }

    return 0;
}`,
    hints: [
      'Use cin for input reading and cout for printing.',
      'Use the test cases tab or Custom Input pane to supply stdin data.',
    ],
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    testCases: [
      {
        id: 'tc-1',
        input: '5\n10 20 30 40 50',
        expectedOutput: 'Sum = 150',
      },
      {
        id: 'tc-2',
        input: '3\n-5 0 5',
        expectedOutput: 'Sum = 0',
      },
    ],
  },
  {
    id: 'two-sum',
    title: '1. Two Sum',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        
    }
};`,
    solutionCode: `#include <vector>
#include <unordered_map>

using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> hash;
        for (int i = 0; i < nums.size(); ++i) {
            int comp = target - nums[i];
            if (hash.count(comp)) {
                return {hash[comp], i};
            }
            hash[nums[i]] = i;
        }
        return {};
    }
};`,
    hints: [
      'Can you use a hash map to store each number and its index as you iterate?',
      'Check if target - current_number exists in your hash map in O(1) time.',
    ],
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    testCases: [
      {
        id: 'tc-1',
        input: '4\n2 7 11 15\n9',
        expectedOutput: '[0,1]',
      },
      {
        id: 'tc-2',
        input: '3\n3 2 4\n6',
        expectedOutput: '[1,2]',
      },
      {
        id: 'tc-3',
        input: '2\n3 3\n6',
        expectedOutput: '[0,1]',
      },
    ],
  },
  {
    id: 'valid-parentheses',
    title: '20. Valid Parentheses',
    difficulty: 'Easy',
    topic: 'Stack & Queue',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        input: 's = "()"',
        output: 'true',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
      },
      {
        input: 's = "(]"',
        output: 'false',
      },
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only "()[]{}"'],
    starterCode: `class Solution {
public:
    bool isValid(string s) {
        
    }
};`,
    hints: [
      'Use a stack to keep track of the most recent open brackets.',
      'When you see a closing bracket, check if it matches the top of the stack.',
    ],
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(N)',
    testCases: [
      {
        id: 'tc-1',
        input: '()[]{}',
        expectedOutput: 'true',
      },
      {
        id: 'tc-2',
        input: '(]',
        expectedOutput: 'false',
      },
      {
        id: 'tc-3',
        input: '{[]}',
        expectedOutput: 'true',
      },
    ],
  },
  {
    id: 'longest-substring-without-repeats',
    title: '3. Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    topic: 'Sliding Window',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3.',
      },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    starterCode: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        
    }
};`,
    hints: [
      'Maintain a sliding window [left, right] of unique characters.',
      'Record the latest index of each seen character.',
    ],
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1) [fixed 256 array]',
    testCases: [
      {
        id: 'tc-1',
        input: 'abcabcbb',
        expectedOutput: '3',
      },
      {
        id: 'tc-2',
        input: 'bbbbb',
        expectedOutput: '1',
      },
      {
        id: 'tc-3',
        input: 'pwwkew',
        expectedOutput: '3',
      },
    ],
  },
  {
    id: 'binary-search',
    title: '704. Binary Search',
    difficulty: 'Easy',
    topic: 'Binary Search',
    description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
    examples: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4',
      },
      {
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        output: '-1',
      },
    ],
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All the integers in nums are unique.'],
    starterCode: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        
    }
};`,
    hints: ['Compute mid = low + (high - low)/2 to avoid integer overflow.'],
    timeComplexity: 'O(log N)',
    spaceComplexity: 'O(1)',
    testCases: [
      {
        id: 'tc-1',
        input: '6\n-1 0 3 5 9 12\n9',
        expectedOutput: '4',
      },
      {
        id: 'tc-2',
        input: '6\n-1 0 3 5 9 12\n2',
        expectedOutput: '-1',
      },
    ],
  },
  {
    id: 'number-of-islands',
    title: '200. Number of Islands',
    difficulty: 'Medium',
    topic: 'Graphs & BFS/DFS',
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return *the number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    examples: [
      {
        input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        output: '1',
      },
      {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: '3',
      },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300', 'grid[i][j] is "0" or "1"'],
    starterCode: `class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        
    }
};`,
    hints: [
      'Iterate through every cell. When encountering land "1", increment island count and trigger DFS/BFS to sink the island.',
    ],
    timeComplexity: 'O(M * N)',
    spaceComplexity: 'O(M * N) call stack in worst case',
    testCases: [
      {
        id: 'tc-1',
        input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1',
        expectedOutput: '3',
      },
    ],
  },
  {
    id: 'coin-change',
    title: '322. Coin Change',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    examples: [
      {
        input: 'coins = [1,2,5], amount = 11',
        output: '3',
        explanation: '11 = 5 + 5 + 1',
      },
      {
        input: 'coins = [2], amount = 3',
        output: '-1',
      },
      {
        input: 'coins = [1], amount = 0',
        output: '0',
      },
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    starterCode: `class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        
    }
};`,
    hints: [
      'Define dp[i] as the minimum coins needed for amount i.',
      'dp[i] = min(dp[i], dp[i - c] + 1) for all c in coins where i >= c.',
    ],
    timeComplexity: 'O(Amount * len(coins))',
    spaceComplexity: 'O(Amount)',
    testCases: [
      {
        id: 'tc-1',
        input: '3\n1 2 5\n11',
        expectedOutput: '3',
      },
      {
        id: 'tc-2',
        input: '1\n2\n3',
        expectedOutput: '-1',
      },
      {
        id: 'tc-3',
        input: '1\n1\n0',
        expectedOutput: '0',
      },
    ],
  },
  {
    id: 'trapping-rain-water',
    title: '42. Trapping Rain Water',
    difficulty: 'Hard',
    topic: 'Two Pointers',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.',
      },
      {
        input: 'height = [4,2,0,3,2,5]',
        output: '9',
      },
    ],
    constraints: ['n == height.length', '1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    starterCode: `class Solution {
public:
    int trap(vector<int>& height) {
        
    }
};`,
    hints: [
      'Two pointers left and right moving towards each other can calculate trapped water in O(1) space.',
    ],
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    testCases: [
      {
        id: 'tc-1',
        input: '12\n0 1 0 2 1 0 1 3 2 1 2 1',
        expectedOutput: '6',
      },
      {
        id: 'tc-2',
        input: '6\n4 2 0 3 2 5',
        expectedOutput: '9',
      },
    ],
  },
  {
    id: 'kth-largest-element',
    title: '215. Kth Largest Element in an Array',
    difficulty: 'Medium',
    topic: 'Heap / Priority Queue',
    description: `Given an integer array \`nums\` and an integer \`k\`, return *the \`k\`th largest element in the array*.

Note that it is the \`k\`th largest element in the sorted order, not the \`k\`th distinct element.

Can you solve it without sorting?`,
    examples: [
      {
        input: 'nums = [3,2,1,5,6,4], k = 2',
        output: '5',
      },
      {
        input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4',
        output: '4',
      },
    ],
    constraints: ['1 <= k <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    starterCode: `class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        
    }
};`,
    hints: [
      'Maintain a min-heap of size k. After inserting all elements, the top of the heap is the kth largest.',
    ],
    timeComplexity: 'O(N log K)',
    spaceComplexity: 'O(K)',
    testCases: [
      {
        id: 'tc-1',
        input: '6\n3 2 1 5 6 4\n2',
        expectedOutput: '5',
      },
      {
        id: 'tc-2',
        input: '9\n3 2 3 1 2 4 5 5 6\n4',
        expectedOutput: '4',
      },
    ],
  },
];
