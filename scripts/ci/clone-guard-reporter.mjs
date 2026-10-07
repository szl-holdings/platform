function escapeAnnotation(value) {
  return String(value).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

/** Make failed clone guards inspectable through the GitHub checks API. */
export default async function* cloneGuardReporter(events) {
  for await (const event of events) {
    if (event.type !== 'test:fail') continue;
    const error = event.data.details?.error;
    const cause = error?.cause ?? error;
    const message = `${event.data.name}\n${cause?.stack ?? cause?.message ?? String(cause)}`;
    yield `::error title=Clone guard failure::${escapeAnnotation(message)}\n`;
  }
}
