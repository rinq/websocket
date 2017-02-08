import React from 'react'
import {connect} from 'react-redux'

import Checkmark from 'grommet/components/icons/base/Checkmark'
import Close from 'grommet/components/icons/base/Close'
import More from 'grommet/components/icons/base/More'
import Table from 'grommet/components/Table'
import TableRow from 'grommet/components/TableRow'

import {exampleCalls} from '../selectors'

export function ExampleLog (props) {
  const {calls} = props

  const rows = calls.map(function (call, seq) {
    const status = call.get('status')
    let statusComponent

    if (status === 'pending') {
      statusComponent = <More colorIndex='unknown' />
    } else if (status === 'success') {
      statusComponent = <Checkmark colorIndex='ok' />
    } else {
      statusComponent = <Close colorIndex='critical' />
    }

    return <TableRow key={seq}>
      <td>{call.get('command')}</td>
      <td>{statusComponent}</td>
      <td>{call.get('error')}</td>
    </TableRow>
  })

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

export default connect(
    function mapStateToProps (state) {
      return {
        calls: exampleCalls(state)
      }
    }
)(ExampleLog)
