import { findSubmissionForTask, normalizeSubmissionRecord } from '@/lib/task-submission';

describe('task submission guard', () => {
  it('ignores malformed submissions without a valid tugas_id', () => {
    const tasks = [{ _id: 'task-123' }];
    const submissions = [
      { _id: 'sub-1', tugas_id: 'task-123', file_url: '/uploads/ok.pdf' },
      { _id: 'sub-2', file_url: '/uploads/bad.pdf' },
      { _id: 'sub-3', tugas_id: null, file_url: '/uploads/null.pdf' },
    ];

    const match = findSubmissionForTask(submissions, tasks[0]._id);
    expect(match).toEqual(submissions[0]);
  });

  it('normalizes a valid submission without throwing when fields are missing', () => {
    const safe = normalizeSubmissionRecord({
      _id: 'sub-9',
      tugas_id: 'task-42',
      file_url: undefined,
      nilai: 0,
    });

    expect(safe).toMatchObject({
      _id: 'sub-9',
      tugas_id: 'task-42',
      file_url: '',
    });
  });
});
