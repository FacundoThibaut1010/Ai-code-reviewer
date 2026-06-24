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
