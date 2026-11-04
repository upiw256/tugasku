export const getSafeTaskId = (value: unknown): string => {
  if (value == null) return '';

  try {
    return String(value).trim();
  } catch {
    return '';
  }
};

export const findSubmissionForTask = (
  submissions: any[] | null | undefined,
  taskId: unknown,
) => {
  const targetTaskId = getSafeTaskId(taskId);
  if (!targetTaskId) return null;

  return (submissions ?? []).find((submission: any) => {
    const submissionTaskId = getSafeTaskId(submission?.tugas_id);
    return submissionTaskId !== '' && submissionTaskId === targetTaskId;
  }) ?? null;
};

export const normalizeSubmissionRecord = (submission: any) => {
  if (!submission || typeof submission !== 'object') return null;

  return {
    ...submission,
    _id: getSafeTaskId(submission._id),
    tugas_id: getSafeTaskId(submission.tugas_id),
    file_url: typeof submission.file_url === 'string' ? submission.file_url : '',
  };
};
