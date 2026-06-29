import { Repository, PullRequest } from '@/types';

const GITHUB_API_URL = 'https://api.github.com';

function getHeaders(token: string, accept = 'application/vnd.github.v3+json') {
  return {
    Authorization: `Bearer ${token}`,
    Accept: accept,
  };
}

export async function fetchUserRepos(token: string): Promise<Repository[]> {
  const response = await fetch(`${GITHUB_API_URL}/user/repos?sort=updated&per_page=100`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching repositories: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

export async function fetchRepoPullRequests(
  token: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'all'
): Promise<PullRequest[]> {
  const response = await fetch(
    `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`,
    {
      headers: getHeaders(token),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching pull requests: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

export async function fetchPullRequestDetails(
  token: string,
  owner: string,
  repo: string,
  number: number
): Promise<PullRequest> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls/${number}`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching pull request details: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

export async function fetchPullRequestDiff(
  token: string,
  owner: string,
  repo: string,
  number: number
): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls/${number}`, {
    headers: getHeaders(token, 'application/vnd.github.v3.diff'),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching pull request diff: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.text();
}

export async function fetchRepoDetails(token: string, owner: string, repo: string): Promise<{ default_branch?: string; description?: string }> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching repository details: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function fetchRepoLanguages(token: string, owner: string, repo: string): Promise<Record<string, number>> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/languages`, {
    headers: getHeaders(token),
  });

  if (!response.ok) return {};
  return response.json();
}

export async function fetchRepoCommits(token: string, owner: string, repo: string): Promise<unknown[]> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/commits?per_page=5`, {
    headers: getHeaders(token),
  });

  if (!response.ok) return [];
  return response.json();
}

export async function fetchRepoTree(token: string, owner: string, repo: string, branch: string): Promise<{ tree: Array<{ path: string; type: string }> }> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Error fetching repository tree: ${response.status}`);
  }

  return response.json();
}

export async function fetchFileContent(token: string, owner: string, repo: string, path: string): Promise<string> {
  const response = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    headers: getHeaders(token),
  });

  if (!response.ok) return '';
  const data = await response.json();
  if (data.encoding === 'base64' && data.content) {
    try {
      // Deno/Browser compatible atob, removing whitespace/newlines
      return atob(data.content.replace(/\s/g, ''));
    } catch {
      return '';
    }
  }
  return '';
}

