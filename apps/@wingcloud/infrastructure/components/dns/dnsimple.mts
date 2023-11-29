import { DNSimple, type ZoneRecordType } from "dnsimple";

interface Record {
  zone: string;
  name: string;
  type: ZoneRecordType;
  content: string;
}

export const createRecords = async (token: string, records: Record[]) => {
  let client = new DNSimple({
    accessToken: token,
  });

  const { data } = await client.identity.whoami();

  for (let record of records) {
    try {
      const res = await client.zones.createZoneRecord(
        data.account.id,
        record.zone,
        {
          name: record.name,
          type: record.type,
          content: record.content,
        },
      );
      console.log("record created", res);
    } catch (error) {
      console.log(`create records: error ${error}`);
      throw error;
    }
  }
};

export const deleteRecords = async (token: string, records: Record[]) => {
  let client = new DNSimple({
    accessToken: token,
  });

  const { data: id } = await client.identity.whoami();

  for (let record of records) {
    const { data } = await client.zones.listZoneRecords(
      id.account.id,
      record.zone,
      {
        name_like: record.name,
      },
    );
    for (let r of data) {
      await client.zones.deleteZoneRecord(id.account.id, record.zone, r.id);
    }
  }
};
