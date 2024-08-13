export function url2obj(url: string) {
  if (!url) throw new Error("Missing DATABASE_URL environment variable");

  var pattern =
    /^(?:([^:\/?#\s]+):\/{2})?(?:([^@\/?#\s]+)@)?([^\/?#\s]+)?(?:\/([^?#\s]*))?(?:[?]([^#\s]+))?\S*$/;
  var matches = url.match(pattern) as string[];
  if (matches?.length && matches?.length < 6)
    throw new Error("Invalid DATABASE_URL");
  var params = {};
  if (matches[5] != undefined) {
    matches[5].split("&").map(function (x) {
      var a = x.split("=");
      params[a[0]] = a[1];
    });
  }

  return {
    protocol: matches[1],
    user: matches[2] != undefined ? matches[2].split(":")[0] : "postgres",
    password: matches[2] != undefined ? matches[2].split(":")[1] : undefined,
    host: matches[3],
    hostname:
      matches[3] != undefined ? matches[3].split(/:(?=\d+$)/)[0] : "localhost",
    port:
      matches[3] != undefined ? Number(matches[3].split(/:(?=\d+$)/)[1]) : 5432,
    segments: matches[4] != undefined ? matches[4].split("/") : "dummy",
    params: params,
  };
}
