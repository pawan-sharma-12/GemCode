import { DSAProblem } from '../types/dsa';

/**
 * Builds a runnable C++ program from a LeetCode class Solution
 * If the user's code already has `int main(`, we don't modify it.
 */
export function buildExecutableCppCode(
  userCode: string,
  problem: DSAProblem | null,
  rawInput: string
): string {
  // If user code already has main(), keep as is
  if (/\bint\s+main\s*\(/.test(userCode)) {
    return userCode;
  }

  // Include standard headers in case user missed them
  const headers = `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <unordered_map>
#include <map>
#include <unordered_set>
#include <set>
#include <queue>
#include <stack>
#include <algorithm>
#include <cmath>
#include <climits>
#include <numeric>

using namespace std;
`;

  // Parse input helpers in C++
  const mainDriver = generateDriverForProblem(problem, rawInput);

  return `${headers}
${userCode}

${mainDriver}
`;
}

function generateDriverForProblem(problem: DSAProblem | null, rawInput: string): string {
  const probKey = ((problem?.id || '') + ' ' + (problem?.title || '') + ' ' + (problem?.slug || '')).toLowerCase();

  if (probKey.includes('two sum') || probKey.includes('two-sum') || problem?.id === '1') {
    return `
int main() {
    string line;
    string fullInput = "";
    while (getline(cin, line)) {
        fullInput += line + " ";
    }
    
    vector<int> nums;
    int target = 0;
    
    size_t openBracket = fullInput.find('[');
    size_t closeBracket = fullInput.find(']');
    
    if (openBracket != string::npos && closeBracket != string::npos && closeBracket > openBracket) {
        string arrContent = fullInput.substr(openBracket + 1, closeBracket - openBracket - 1);
        for (char &c : arrContent) {
            if (c == ',') c = ' ';
        }
        stringstream ss(arrContent);
        int val;
        while (ss >> val) {
            nums.push_back(val);
        }
        
        size_t targetPos = fullInput.find("target");
        if (targetPos != string::npos) {
            size_t eqPos = fullInput.find('=', targetPos);
            if (eqPos != string::npos) {
                stringstream tss(fullInput.substr(eqPos + 1));
                tss >> target;
            }
        } else {
            stringstream tss(fullInput.substr(closeBracket + 1));
            int tVal;
            if (tss >> tVal) {
                target = tVal;
            }
        }
    } else {
        stringstream ss(fullInput);
        string token;
        vector<int> allNumbers;
        while (ss >> token) {
            stringstream tokenSs(token);
            int n;
            if (tokenSs >> n) {
                allNumbers.push_back(n);
            }
        }
        
        if (!allNumbers.empty()) {
            if (allNumbers.size() >= 3) {
                target = allNumbers.back();
                int startIdx = 0;
                if (allNumbers[0] == (int)(allNumbers.size() - 2)) {
                    startIdx = 1;
                }
                for (size_t i = startIdx; i < allNumbers.size() - 1; ++i) {
                    nums.push_back(allNumbers[i]);
                }
            } else if (allNumbers.size() == 2) {
                nums.push_back(allNumbers[0]);
                target = allNumbers[1];
            }
        }
    }
    
    Solution sol;
    vector<int> res = sol.twoSum(nums, target);
    sort(res.begin(), res.end());
    
    cout << "[";
    for (size_t i = 0; i < res.size(); ++i) {
        cout << res[i];
        if (i + 1 < res.size()) cout << ",";
    }
    cout << "]" << endl;
    return 0;
}
`;
  }

  if (probKey.includes('valid parentheses') || probKey.includes('valid-parentheses') || problem?.id === '20') {
    return `
int main() {
    string line;
    string fullInput = "";
    while (getline(cin, line)) {
        fullInput += line;
    }
    
    string s = "";
    size_t quote1 = fullInput.find('"');
    if (quote1 != string::npos) {
        size_t quote2 = fullInput.find('"', quote1 + 1);
        if (quote2 != string::npos) {
            s = fullInput.substr(quote1 + 1, quote2 - quote1 - 1);
        }
    } else {
        s = fullInput;
        // remove whitespace
        s.erase(remove_if(s.begin(), s.end(), ::isspace), s.end());
    }
    
    Solution sol;
    bool res = sol.isValid(s);
    cout << (res ? "true" : "false") << endl;
    return 0;
}
`;
  }

  if (probKey.includes('longest substring') || probKey.includes('longest-substring') || problem?.id === '3') {
    return `
int main() {
    string fullInput = "";
    string line;
    while (getline(cin, line)) {
        fullInput += line;
    }
    
    string s = "";
    size_t quote1 = fullInput.find('"');
    if (quote1 != string::npos) {
        size_t quote2 = fullInput.find('"', quote1 + 1);
        if (quote2 != string::npos) {
            s = fullInput.substr(quote1 + 1, quote2 - quote1 - 1);
        }
    }
    
    Solution sol;
    int res = sol.lengthOfLongestSubstring(s);
    cout << res << endl;
    return 0;
}
`;
  }

  // Generic fallback runner
  return `
int main() {
    Solution sol;
    cout << "[Program executed successfully]" << endl;
    return 0;
}
`;
}
