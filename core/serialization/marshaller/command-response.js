export default function marshalCommandResponse ({message, header}) {
  header.push(message.seq)
}
