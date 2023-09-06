export type TQueueListOptions =
{
	pageNo ?: number,
	pageSize ?: number,
	pageKey ?: number,
};

export type TQueueListResult = TQueueListOptions &
{
	total : number,
};
