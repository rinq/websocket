import React from 'react'
import {connect} from 'react-redux'

import Checkmark from 'grommet/components/icons/base/Checkmark'
import Close from 'grommet/components/icons/base/Close'
import More from 'grommet/components/icons/base/More'
import Table from 'grommet/components/Table'
import TableRow from 'grommet/components/TableRow'

const log = props => {
  const {calls} = props
  const rows = []

  for (let seq in calls) {
    const call = calls[seq]
    let status

    if (call.status === 'pending') {
      status = <More colorIndex='unknown' />
    } else if (call.status === 'success') {
      status = <Checkmark colorIndex='ok' />
    } else {
      status = <Close colorIndex='critical' />
    }

    const row = <TableRow key={seq}>
      <td>{call.command}</td>
      <td>{status}</td>
      <td>{call.error}</td>
    </TableRow>

    rows.push(row)
  }

  return <Table>
    <thead>
      <tr>
        <th>Command</th>
        <th>Result</th>
        <th>Message</th>
      </tr>
    </thead>

    <tbody>{rows}</tbody>
  </Table>
}

const ExampleLog = connect(
    function mapStateToProps (state) {
      return {
        calls: state.example.calls
      }
    }
)(log)

export default ExampleLog
